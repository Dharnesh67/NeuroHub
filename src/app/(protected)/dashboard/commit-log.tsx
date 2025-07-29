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
    }
  );

  if (commitsQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gradient-to-r from-white to-gray-50 dark:from-[#0d1117] dark:to-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <div className="flex gap-4 items-start">
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
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
          <GitCommit className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No project selected</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400">Please select a project to view commits</p>
        </div>
      </div>
    );
  }

  if (commitsQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-xl border-2 shadow-lg">
        <AlertDescription className="flex items-center justify-center text-lg font-medium">
          Failed to load commits. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!commitsQuery.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
          <GitCommit className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No commits found</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400">This project doesn&apos;t have any commits yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
          <GitCommit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Commit History</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{commitsQuery.data.length} commits</p>
        </div>
      </div>
      
      {commitsQuery.data.map((commit, index) => {
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
            className="group relative bg-gradient-to-r from-white via-gray-50 to-white dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace" }}
          >
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="p-6">
              <div className="flex gap-4 items-start">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-gray-200 dark:border-gray-700 shadow-md">
                    <AvatarImage src={commitAuthorAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Header with author and metadata */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {commitAuthorName}
                    </span>
                    
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-base">{timeAgo(commitDate.toString())}</span>
                    </div>
                    
                    <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                      <Hash className="h-3 w-3 mr-1" />
                      {commitHash.slice(0, 7)}
                    </Badge>
                  </div>
                  
                  {/* Commit message */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-lg text-gray-800 dark:text-gray-200 break-words leading-relaxed">
                        {commitMessage}
                      </span>
                    </div>
                    
                    {Summary && (
                      <div className="ml-7 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-base">AI Summary</span>
                        </div>
                        <p className="text-blue-800 dark:text-blue-200 text-base leading-relaxed">
                          {Summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
        );
      })}
    </div>
  );
};

export default CommitLogs;