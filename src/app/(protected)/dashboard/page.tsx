"use client";
import React from "react";
import useProjects from "@/hooks/use-projects";
import {
  ExternalLink,
  Github,
  Users,
  Archive,
  UserPlus,
  Calendar,
  MessageSquare,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import CommitLogs from "./commit-log";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import AskQuestion from "./AskQuestion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MeetingCard from "./MeetingCard";

const Page = () => {
  const { Project, projects, deleteProject, isDeleting } = useProjects();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDeleteProject = async () => {
    if (Project) {
      await deleteProject(Project.id);
      setShowDeleteDialog(false);
    }
  };

  // Show banner if no projects exist
  if (!projects || projects.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="text-destructive h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">
              <div className="flex items-center justify-between">
                <span>
                  No projects found. Create your first project to get started.
                </span>
                <Link href="/Create-project">
                  <Button
                    size="sm"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Create Project
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show banner if no project is selected
  if (!Project) {
    return (
      <div className="flex min-h-screen w-full flex-col pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <Alert className="border-primary/20 bg-primary/10">
            <AlertTriangle className="text-primary h-4 w-4" />
            <AlertDescription className="text-primary-foreground">
              <div className="flex items-center justify-between">
                <span>
                  No project selected. Please select a project from the sidebar
                  to view its dashboard.
                </span>
                <span className="text-primary/80 text-sm">
                  Available projects: {projects.length}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          {/* Topbar */}
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:justify-between">
            {/* GitHub URL Card */}
            <div className="min-w-0 flex-1">
              <div className="from-primary to-primary/80 border-primary/40 relative flex items-center gap-6 rounded-2xl border bg-gradient-to-r px-6 py-6 shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl sm:px-8 sm:py-7">
                <div className="bg-primary-foreground/10 border-primary-foreground/20 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-inner sm:h-16 sm:w-16">
                  <Github className="text-primary-foreground h-7 w-7 sm:h-9 sm:w-9" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-primary-foreground max-w-xs truncate text-2xl font-extrabold sm:max-w-md sm:text-3xl">
                      {Project.name}
                    </h1>
                    {Project.githubUrl && (
                      <Link
                        href={Project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium shadow transition hover:shadow-md"
                        aria-label="Open GitHub project"
                      >
                        <Github className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">GitHub</span>
                        <ExternalLink className="ml-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => setShowDeleteDialog(true)}
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {Project.githubUrl && (
                    <span className="text-primary-foreground/80 decoration-primary-foreground/30 hover:decoration-primary-foreground/50 mt-2 text-xs break-all underline underline-offset-2 transition sm:text-sm">
                      {Project.githubUrl}
                    </span>
                  )}
                </div>
                {/* Decorative accent */}
                <div className="pointer-events-none absolute top-4 right-4 opacity-20 select-none">
                  <Github className="h-16 w-16 sm:h-20 sm:w-20" />
                </div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="min-w-0 flex-1">
              <div className="border-border bg-card/50 h-full rounded-2xl border px-6 py-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
                    <span className="text-card-foreground text-lg font-semibold tracking-wide">
                      Team Members
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3">
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50 flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold shadow transition focus:ring-2 focus:outline-none active:scale-95">
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Invite
                    </button>
                    <button
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50 flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold shadow transition focus:ring-2 focus:outline-none active:scale-95"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Ask Question Card */}

            <AskQuestion />

            <MeetingCard />
          </div>

          {/* Lower Section */}
        </div>
        <div className="p-2">
          {Project?.id !== "" && Project?.id != null && <CommitLogs />}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{Project?.name}&quot;? This
              action cannot be undone. The project will be permanently removed
              from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Page;
