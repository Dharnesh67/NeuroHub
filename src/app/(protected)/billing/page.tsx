"use client";
import useProjects from "@/hooks/use-projects";
import React from "react";

const Page = () => {
  const {  Project } = useProjects();
  return <div>{JSON.stringify(Project)}</div>;
};

export default Page;
