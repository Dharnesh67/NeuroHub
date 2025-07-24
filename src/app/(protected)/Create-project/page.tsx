"use client";
import React from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormInput = {
  repoUrl: string;
  Projectname: string;
  githubToken: string;
};

const Page = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>();

  const onSubmit = async (data: FormInput) => {
    window.alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="flex w-full shadow-xl rounded-xl overflow-hidden bg-background border border-border">
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm flex flex-col gap-4"
          noValidate
        >
          <div>
            <Input
              type="text"
              placeholder="Project Name"
              {...register("Projectname", { required: "Project name is required" })}
              className={`border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm ${
                errors.Projectname ? "border-destructive" : ""
              }`}
              aria-invalid={!!errors.Projectname}
            />
            {errors.Projectname && (
              <span className="text-destructive text-xs">{errors.Projectname.message}</span>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="Repo URL"
              {...register("repoUrl", { required: "Repo URL is required" })}
              className={`border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm ${
                errors.repoUrl ? "border-destructive" : ""
              }`}
              aria-invalid={!!errors.repoUrl}
            />
            {errors.repoUrl && (
              <span className="text-destructive text-xs">{errors.repoUrl.message}</span>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="GitHub Token"
              {...register("githubToken", { required: "GitHub token is required" })}
              className={`border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm ${
                errors.githubToken ? "border-destructive" : ""
              }`}
              aria-invalid={!!errors.githubToken}
            />
            {errors.githubToken && (
              <span className="text-destructive text-xs">{errors.githubToken.message}</span>
            )}
          </div>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground rounded px-4 py-2 font-semibold shadow hover:bg-primary/90 transition-colors mt-2"
          >
            Create Project
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Page;
