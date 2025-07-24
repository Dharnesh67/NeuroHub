"use client";
import React from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Input } from "@/components/ui/input";
type FormInput = {
  repoUrl: string;
  Projectname: string;
  githubToken?: string;
};

const Page = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const onSubmit = async (data: FormInput) => {
    window.alert(data)
  };
  return (
    <div className="flex w-full  shadow-xl rounded-xl overflow-hidden bg-background border border-border">
    {/* Left side: Full-cover image */}
    <div className="relative flex-1 min-w-0 h-auto hidden md:block">
      <Image
        src="/github.jpg"
        alt="NeuroHub GitHub"
        fill
        style={{ objectFit: "cover" }}
        priority
        className="rounded-l-xl"
      />
    </div>
    {/* Right side: Form */}
    <div className="flex flex-1 flex-col items-center justify-center p-10 bg-background rounded-r-xl">
      {/* App Logo */}
      <Image
        src="/logo.svg"
        alt="NeuroHub Logo"
        width={60}
        height={60}
        className="mb-4"
      />
      {/* Title with GitHub logo */}
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Link Your Github Repository</h1>
        <Image
          src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
          alt="GitHub"
          width={28}
          height={28}
          className="inline-block"
        />
      </div>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Enter your repo URL and GitHub token to link your repository to NeuroHub.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm flex flex-col gap-4">
        <Input
            required
          type="text"
          placeholder="Project Name"
          {...register("Projectname")}
          className="border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        />
        <Input
          type="text"
          placeholder="Repo URL"
          {...register("repoUrl")}
          className="border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        />
        <Input
          type="text"
          placeholder="GitHub Token"
          {...register("githubToken")}
          className="border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded px-4 py-2 font-semibold shadow hover:bg-primary/90 transition-colors mt-2"
        >
          Create Project
        </button>
      </form>
    </div>
  </div>
  );
};

export default Page;
