"use client";
import { useEffect } from "react";
import useProjects from "@/hooks/use-projects";
import { PullCommits } from "@/lib/github1";
import { UserButton } from "@clerk/nextjs";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import React from "react";

const Page = () => {
  const { Project } = useProjects();

  return (
    <div className="flex w-full flex-col justify-start gap-2">
      {/* Topbar */}
      {Project?.id}
      <div className="topbar mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Github Url */}
        <div className="Url border-primary bg-primary/90 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-md">
          <Github className="h-5 w-5 text-white" />
          <span className="flex flex-wrap items-center gap-2 font-medium text-white">
            This project is linked to
            <span className="ml-1 underline underline-offset-2">
              {Project?.githubUrl ? (
                <Link
                  href={Project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-blue-200"
                  aria-label="Open GitHub project"
                >
                  <span className="truncate">{Project.githubUrl}</span>
                  <ExternalLink className="h-5 w-5 text-white transition-colors hover:text-blue-200" />
                </Link>
              ) : (
                <span className="text-gray-200 italic">No GitHub URL</span>
              )}
            </span>
          </span>
        </div>
        {/* Team Members */}
        <div>
          <div>TeamMembers</div>
          <div>InviteButton</div>
          <div>ArchiveButton</div>
        </div>
      </div>
      {/* Middle Section */}
      <div className="middleSection flex justify-between">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-96 w-96 border">AskQuestion Card</div>
          <div className="h-96 w-96 border">Meeting Card</div>
        </div>
      </div>
      {/* Lower Section */}
        <div className="lowerSection flex justify-between">
        <div
        className="w-full border"
        >
          Commit Logs
        </div>
      </div>
    </div>
  );
};

export default Page;
