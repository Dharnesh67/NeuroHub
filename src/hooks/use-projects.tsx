"use client";
import React from "react";
import { api } from "@/trpc/react";
import { useLocalStorage } from "@uidotdev/usehooks";
const useProjects = () => {
  const {data:projects} = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage("projectId");
  const Project = projects?.find((project) => project.id === projectId);
  return {
    projects,
    projectId,
    Project,
    setProjectId
  };
};

export default useProjects;
