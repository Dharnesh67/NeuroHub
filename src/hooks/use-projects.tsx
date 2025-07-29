"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/trpc/react";

const useProjects = () => {
  const { data: projects } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("projectId");
    if (stored) setProjectId(stored);
  }, []);

  useEffect(() => {
    if (isClient && projectId) {
      localStorage.setItem("projectId", projectId);
    }
  }, [projectId, isClient]);

  // Auto-select first project if no project is selected and projects are available
  useEffect(() => {
    if (isClient && projects && projects.length > 0 && !projectId) {
      const firstProject = projects[0];
      if (firstProject) {
        setProjectId(firstProject.id);
        localStorage.setItem("projectId", firstProject.id);
      }
    }
  }, [isClient, projects, projectId]);

  const Project = projects?.find((project) => project.id === projectId);
  return {
    projects,
    projectId,
    Project,
    setProjectId,
  };
};

export default useProjects;
