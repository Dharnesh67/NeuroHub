import { PullCommits, getProjectStats } from "@/lib/github";
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

        // Start commit processing in the background (non-blocking)
        PullCommits(project.id).catch((error) => {
          console.error(`Background commit processing failed for project ${project.id}:`, error);
        });

        return {
          success: true,
          project,
          message: "Project created successfully. Commits are being processed in the background.",
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

        // Start commit processing
        const result = await PullCommits(input.projectId);

        return {
          success: true,
          message: `Successfully processed ${result.processed} new commits out of ${result.total} total commits`,
          processed: result.processed,
          total: result.total,
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

        // Soft delete the project
        await ctx.db.project.update({
          where: { id: input.projectId },
          data: { deletedAt: new Date() },
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
            deletedAt: null,
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

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




