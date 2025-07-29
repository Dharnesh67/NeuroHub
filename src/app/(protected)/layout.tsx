"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./AppSidebar";
import React from "react";

const SideBarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider
    defaultOpen={true}
    className="h-screen overflow-hidden"
    >
      <AppSidebar/>
      <main className="m-2 w-full">
        {/* <SearchBar/> */}
        <div className="flex justify-end rounded-md border border-border bg-[var(--sidebar)] p-2 shadow-md">
          <UserButton />
        </div>
        <div className="my-2"></div>
        <div className="flex justify-end rounded-md  h-[95vh] overflow-y-scroll border border-border bg-[var(--sidebar)] p-2 shadow-md">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SideBarLayout;
