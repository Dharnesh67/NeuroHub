"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./AppSidebar";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const SideBarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider defaultOpen={true} className="h-screen overflow-hidden">
      <AppSidebar />
      <main className="m-2 w-full">
        {/* <SearchBar/> */}
        <div className="border-border flex justify-between rounded-md border bg-[var(--sidebar)] p-2 shadow-md">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <Link
              href="/dashboard"
              className="flex cursor-pointer items-center gap-2 sm:gap-3"
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.svg"
                alt="NeuroHub logo"
                width={28}
                height={28}
                className="sm:h-9 sm:w-9"
                priority
              />
              <span className="text-foreground text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
                NeuroHub
              </span>
            </Link>
          </div>
          <UserButton />
        </div>
        <div className="my-2"></div>
        <div className="border-border flex h-[95vh] justify-end overflow-y-scroll rounded-md border bg-[var(--sidebar)] p-2 shadow-md">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SideBarLayout;
