"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

const useProjects = () => {
  const { data: projects, refetch } = api.project.getProjects.useQuery();
  const deleteProjectMutation = api.project.deleteProject.useMutation();
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
  // Also validate that the current projectId is still valid
  useEffect(() => {
    if (isClient && projects) {
      // Check if current projectId is still valid
      if (projectId && projects.length > 0) {
        const currentProjectExists = projects.find(p => p.id === projectId);
        if (!currentProjectExists) {
          setProjectId("");
          localStorage.removeItem("projectId");
        }
      }
      
      // Auto-select first project if no project is selected and projects are available
      if (projects.length > 0 && !projectId) {
        const firstProject = projects[0];
        if (firstProject) {
          setProjectId(firstProject.id);
          localStorage.setItem("projectId", firstProject.id);
        }
      }
    }
  }, [isClient, projects, projectId]);

  const Project = projects?.find((project) => project.id === projectId);

  const deleteProject = async (projectIdToDelete: string) => {
    try {
      await deleteProjectMutation.mutateAsync({ projectId: projectIdToDelete });
      toast.success("Project deleted successfully");
      
      // If we deleted the currently selected project, clear the selection
      if (projectIdToDelete === projectId) {
        setProjectId("");
        localStorage.removeItem("projectId");
      }
      
      // Refetch projects to update the list
      await refetch();
    } catch (error) {
      toast.error("Failed to delete project");
      console.error("Error deleting project:", error);
    }
  };
  
  return {
    projects,
    projectId,
    Project,
    setProjectId,
    deleteProject,
    isDeleting: deleteProjectMutation.isPending,
  };
};

export default useProjects;
