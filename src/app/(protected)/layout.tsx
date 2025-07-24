import { SidebarProvider } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./AppSidebar";
import React from "react";

const SideBarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider
    defaultOpen={true}
    className="h-screen"
    >
      <AppSidebar/>
      <main className="m-2 w-full">
        {/* <SearchBar/> */}
        <div className="flex justify-end rounded-md border border-border bg-background p-2 shadow-md">
          <UserButton />
        </div>
        <div className="my-2"></div>
        <div className="flex justify-end rounded-md  h-[94vh] border border-border bg-background p-2 shadow-md">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SideBarLayout;
