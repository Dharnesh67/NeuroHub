import { PullCommits, getProjectStats } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

// Enhanced input validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  githubUrl: z.string().url("Invalid GitHub URL").refine(
    (url) => url.includes("github.com"),
    "Must be a valid GitHub URL"
  ),
  githubToken: z.string().optional(),
});

const projectIdSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const projectCommitsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  githubUrl: z.string().optional(),
  githubToken: z.string().optional(),
});

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if project already exists for this user
        const existingProject = await ctx.db.project.findFirst({
          where: {
            githubUrl: input.githubUrl,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
          },
        });

        if (existingProject) {
          throw new Error("Project with this GitHub URL already exists for your account");
        }

        // Create the project
        const project = await ctx.db.project.create({
          data: {
            name: input.name,
            githubUrl: input.githubUrl,
            UsertoProject: {
              create: {
                userId: ctx.user.userId!,
              },
            },
          },
          include: {
            UsertoProject: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        // Start commit processing and code indexing in the background (non-blocking)
        (async () => {
          try {
            await PullCommits(project.id);
            await indexGithubRepo(project.id, input.githubUrl, input.githubToken || "");
          } catch (error) {
            console.error(`Background commit processing or indexing failed for project ${project.id}:`, error);
          }
        })();

        return {
          success: true,
          project,
          message: "Project created successfully. Commits and codebase are being processed in the background.",
        };
      } catch (error) {
        console.error("Error creating project:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to create project");
      }
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    try {
      const projects = await ctx.db.project.findMany({
        where: {
          UsertoProject: {
            some: { userId: ctx.user.userId! },
          },
          deletedAt: null, // Only show non-deleted projects
        },
        include: {
          UsertoProject: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              commit: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }),

  getProject: protectedProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
            deletedAt: null,
          },
          include: {
            commit: {
              orderBy: {
                commitDate: "desc",
              },
              take: 50, // Limit to recent commits
            },
            _count: {
              select: {
                commit: true,
              },
            },
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        return project;
      } catch (error) {
        console.error("Error fetching project:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to fetch project");
      }
    }),

  refreshCommits: protectedProcedure
    .input(projectIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project ownership
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        // Start commit processing and code indexing
        const pullResult = await PullCommits(input.projectId);

        // Also re-index the codebase to ensure new code is indexed
        await indexGithubRepo(
          input.projectId,
          project.githubUrl,
          ""
        );

        return {
          success: true,
          message: `Successfully processed ${pullResult.processed} new commits out of ${pullResult.total} total commits. Codebase re-indexed.`,
          processed: pullResult.processed,
          total: pullResult.total,
        };
      } catch (error) {
        console.error("Error refreshing commits:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to refresh commits");
      }
    }),

  deleteProject: protectedProcedure
    .input(projectIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project ownership
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        // Hard delete the project
        await ctx.db.project.delete({
          where: { id: input.projectId },
        });

        return {
          success: true,
          message: "Project deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to delete project");
      }
    }),

  getProjectStats: protectedProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Verify project ownership
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        const stats = await getProjectStats(input.projectId);

        return {
          totalCommits: stats._count.commitHash,
          lastUpdated: project.updatedAt,
        };
      } catch (error) {
        console.error("Error fetching project stats:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to fetch project stats");
      }
    }),

  getProjectCommits: protectedProcedure
    .input(projectCommitsSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Verify project ownership and not deleted
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            UsertoProject: {
              some: { userId: ctx.user.userId! },
            },
            deletedAt: null,
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        // Always check for new commits before returning the list
        // This ensures that if a new commit comes, we pull and index it
        const repoUrl = input?.githubUrl || project.githubUrl;
        const token = input?.githubToken || "";

        // Pull new commits and index codebase if there are new commits
        // (This could be optimized with a webhook or polling, but here we do it on every fetch)
        await PullCommits(project.id);
        await indexGithubRepo(project.id, repoUrl, token);

        // Now fetch the latest commits from the DB
        const commits = await ctx.db.commit.findMany({
          where: { projectId: input.projectId },
          orderBy: {
            commitDate: "desc",
          },
        });

        return commits;
      } catch (error) {
        console.error("Error fetching project commits:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to fetch project commits");
      }
    }),
});

