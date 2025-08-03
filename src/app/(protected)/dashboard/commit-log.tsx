"use client";
import React from "react";
import useProjects from "@/hooks/use-projects";
import { api } from "@/trpc/react";
import { GitCommit, User, Clock, Hash, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

const CommitLogs = () => {
  const { projectId } = useProjects();

  const commitsQuery = api.project.getProjectCommits.useQuery(
    { projectId: projectId || "" },
    {
      enabled: !!projectId,
    },
  );

  if (commitsQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 py-16">
        <div className="rounded-full bg-primary/10 p-6">
          <GitCommit className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            No project
          </h3>
          <p className="text-md text-muted-foreground">
            Select a project to see commits
          </p>
        </div>
      </div>
    );
  }

  if (commitsQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-xl border-2 shadow-lg">
        <AlertDescription className="text-md flex items-center justify-center font-medium">
          Failed to load commits. Try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!commitsQuery.data?.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 py-16">
        <div className="rounded-full bg-primary/10 p-6">
          <GitCommit className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            No commits
          </h3>
          <p className="text-md text-muted-foreground">
            No commits in this project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <GitCommit className="h-6 w-6 text-foreground" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Commits
          </h2>
          <p className="text-sm text-muted-foreground">
            {commitsQuery.data.length} total
          </p>
        </div>
      </div>

      {commitsQuery.data.map((commit) => {
        const {
          id,
          commitMessage,
          commitHash,
          commitAuthorName,
          commitDate,
          commitAuthorAvatar,
          Summary,
        } = commit;

        return (
          <div
            key={id}
            className="rounded-lg border border-border bg-card p-4"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
            }}
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={commitAuthorAvatar} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {commitAuthorName}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{timeAgo(commitDate.toString())}</span>
                  </div>
                  <span className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {commitHash.slice(0, 7)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm leading-relaxed break-words text-foreground">
                      {commitMessage}
                    </span>
                  </div>
                  {Summary && (
                    <div className="ml-6 rounded border border-border bg-muted p-3">
                      <span className="text-sm font-semibold text-foreground">
                        Summary
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {Summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommitLogs;
