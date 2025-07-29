"use client";
import React from "react";
import useProjects from "@/hooks/use-projects";
import { ExternalLink, Github, Users, Archive, UserPlus, Calendar, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import CommitLogs from "./commit-log";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
      <div className="flex w-full flex-col min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl lg:px-8 px-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="flex items-center justify-between">
                <span>No projects found. Create your first project to get started.</span>
                <Link href="/Create-project">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
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
      <div className="flex w-full flex-col min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl lg:px-8 px-4">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex items-center justify-between">
                <span>No project selected. Please select a project from the sidebar to view its dashboard.</span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
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
      <div className="flex w-full flex-col  min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl lg:px-8 px-4">
          {/* Topbar */}
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:justify-between">
            {/* GitHub URL Card */}
            <div className="min-w-0 flex-1">
              <div className="relative flex items-center gap-6 rounded-2xl bg-gradient-to-r from-primary/90 to-blue-700/90 px-6 py-6 sm:px-8 sm:py-7 shadow-xl border border-primary/40 transition-all hover:scale-[1.01] hover:shadow-2xl">
                <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/10 shadow-inner border-2 border-white/20">
                  <Github className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate max-w-xs sm:max-w-md">
                      {Project.name}
                    </h1>
                    {Project.githubUrl && (
                      <Link
                        href={Project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition font-medium shadow hover:shadow-md"
                        aria-label="Open GitHub project"
                      >
                        <Github className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                        <span className="hidden sm:inline">GitHub</span>
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setShowDeleteDialog(true)}
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {Project.githubUrl && (
                    <span className="mt-2 text-xs sm:text-sm text-white/80 break-all underline underline-offset-2 decoration-white/30 hover:decoration-white/50 transition">
                      {Project.githubUrl}
                    </span>
                  )}
                </div>
                {/* Decorative accent */}
                <div className="absolute right-4 top-4 opacity-20 pointer-events-none select-none">
                  <Github className="h-16 w-16 sm:h-20 sm:w-20" />
                </div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="min-w-0 flex-1">
              <div className="border-muted/50 bg-muted/50 h-full rounded-2xl border px-6 py-5 shadow-lg transition-all hover:shadow-xl backdrop-blur-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
                    <span className="text-foreground text-lg font-semibold tracking-wide">
                      Team Members
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 active:scale-95">
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Invite
                    </button>
                    <button 
                      className="bg-destructive/90 flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 active:scale-95"
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
            <div className="bg-card flex h-96 flex-col rounded-2xl border border-muted/40 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="text-primary mb-4 text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Ask a Question</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono">Beta</span>
              </div>
              <div className="text-muted-foreground bg-muted/20 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 p-6 text-center">
                <div className="max-w-xs space-y-2">
                  <span className="text-lg font-medium">Have questions about the project?</span>
                  <p className="text-sm text-muted-foreground/80">
                    Ask your team members anything related to the project and get quick responses.
                  </p>
                </div>
              </div>
              <button className="bg-primary hover:bg-primary/90 mt-6 self-end rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95">
                Ask Question
              </button>
            </div>

            {/* Upcoming Meeting Card */}
            <div className="bg-card flex h-96 flex-col rounded-2xl border border-muted/40 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="text-primary mb-4 text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Meeting</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono">Soon</span>
              </div>
              <div className="text-muted-foreground bg-muted/20 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 p-6 text-center">
                <div className="max-w-xs space-y-2">
                  <span className="text-lg font-medium">No meetings scheduled</span>
                  <p className="text-sm text-muted-foreground/80">
                    Schedule your next team meeting to discuss project progress and blockers.
                  </p>
                </div>
              </div>
              <button className="bg-primary hover:bg-primary/90 mt-6 self-end rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95">
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Lower Section */}
        </div>
          <div className="p-2">
          
             {Project?.id!=="" && Project?.id!=null && <CommitLogs />}
                    
          </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{Project?.name}&quot;? This action cannot be undone.
              The project will be permanently removed from your account.
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