"use client";
import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  CreditCard,
  Users2,
  BarChart3,
  FolderGit2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { redirect, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import type { Project } from "@/type";
import { api } from "@/trpc/react";
import useProjects from "@/hooks/use-projects";

// TODO: Replace with router-based active route detection
const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Q&A",
    icon: BarChart3,
    href: "/qa",
  },
  {
    label: "Meetings",
    icon: Users2,
    href: "/meetings",
  },
  {
    label: "Billing",
    icon: CreditCard,
    href: "/billing",
  },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Using Custom Hook use-projects.tsx
  const { projects, projectId, Project, setProjectId } = useProjects();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const { user } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    const stored = window.localStorage.getItem("sidebar-collapsed");
    setIsCollapsed(stored === "true");
  }, []);

  // Auto-collapse on mobile, expand on desktop
  useEffect(() => {
    if (isClient) {
      if (isMobile) setIsCollapsed(true);
      else {
        const stored = window.localStorage.getItem("sidebar-collapsed");
        setIsCollapsed(stored === "true");
      }
    }
  }, [isMobile, isClient]);

  // Persist collapse state (not on mobile)
  useEffect(() => {
    if (isClient && !isMobile) {
      window.localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed, isMobile, isClient]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Memoize user info for performance
  const userInfo = useMemo(() => {
    if (!user)
      return { name: "User", email: null, phone: null, hasGoogle: false };
    return {
      name: user.fullName || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress || null,
      phone: user.primaryPhoneNumber?.phoneNumber || null,
      hasGoogle: !!user.externalAccounts?.find(
        (acc) => acc.provider === "google",
      ),
    };
  }, [user]);

  return (
    <aside
      className={`${isCollapsed ? "w-20 min-w-[5rem]" : "w-64 min-w-[16rem]"} m-2 flex flex-col rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-2xl transition-[width] duration-500`}
    >
      {/* Collapse Button */}
      <div className="flex items-center justify-end px-2 pt-2">
        <button
          onClick={toggleSidebar}
          className={`group rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar)] p-2 shadow-lg transition-all duration-200 hover:border-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)] focus:ring-2 focus:ring-[var(--sidebar-ring)] focus:outline-none active:scale-95`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSidebar();
            }
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="flex cursor-pointer items-center gap-3 border-b border-[var(--sidebar-border)] px-6 py-5">
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => {
            redirect("/dashboard");
          }}
        >
          <Image
            src="/logo.svg"
            alt="NeuroHub logo"
            width={36}
            height={36}
            priority
          />
          {!isCollapsed && (
            <span className="text-2xl font-extrabold tracking-tight text-[var(--sidebar-foreground)]">
              NeuroHub
            </span>
          )}
        </div>
      </div>

      {/* Sidebar Content */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-4">
        {/* Application Group */}
        <section className="mt-4 rounded-xl border border-[var(--sidebar-border)] p-2 shadow-[var(--sidebar-ring)] shadow-md">
          {!isCollapsed && (
            <h2 className="px-2 py-2 text-xs font-semibold tracking-widest text-[var(--sidebar-accent-foreground)] uppercase">
              Application
            </h2>
          )}
          <ul className="space-y-1">
            {menuItems.map(({ label, icon: Icon, href }) => {
              const isActive = pathname === href;
              return (
                <li key={label}>
                  <Link
                    href={href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                    } `}
                    title={isCollapsed ? label : undefined}
                    tabIndex={0}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                        isActive
                          ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                          : "bg-[var(--sidebar)] text-[var(--sidebar-foreground)] group-hover:text-[var(--sidebar-accent-foreground)]"
                      } `}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Projects Group */}
        <section className="mt-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg-alt,transparent)] p-3 shadow-[var(--sidebar-ring)] shadow-md">
          {!isCollapsed && (
            <h2 className="mb-2 border-b border-[var(--sidebar-border)] px-2 py-1 text-xs font-bold tracking-widest text-[var(--sidebar-accent-foreground)] uppercase">
              Projects
            </h2>
          )}
          <ul className="space-y-1">
            {projects?.map((project) => (
              <li key={project.id}>
                <div
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[var(--sidebar-foreground)] shadow-md transition-colors duration-150 hover:animate-pulse hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] focus:ring-2 focus:ring-[var(--sidebar-accent)] focus:outline-none"
                  title={isCollapsed ? project.name : undefined}
                  tabIndex={0}
                  onClick={() => {
                    setProjectId(project.id);
                    redirect("/dashboard");
                  }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-colors duration-150 group-hover:bg-[var(--sidebar-accent)] group-hover:text-[var(--sidebar-accent-foreground)]">
                    <FolderGit2 className="h-5 w-5" />
                  </span>
                  {!isCollapsed && (
                    <span className="truncate text-sm font-medium">
                      {project.name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="my-4 flex items-center justify-center">
            {!isCollapsed ? (
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--sidebar-primary)] px-3 py-2 font-semibold text-[var(--sidebar-primary-foreground)] shadow transition-colors duration-150 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] focus:ring-2 focus:ring-[var(--sidebar-accent)] focus:outline-none"
                aria-label="Add Project"
                href="/Create-project"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project</span>
              </Link>
            ) : (
              <Button
                className="flex items-center justify-center rounded-lg bg-[var(--sidebar-primary)] p-2 font-semibold text-[var(--sidebar-primary-foreground)] shadow transition-colors duration-150 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] focus:ring-2 focus:ring-[var(--sidebar-accent)] focus:outline-none"
                aria-label="Add Project"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>

        {/* Spacer */}
        <div className="flex-1" />
        {/* Theme Toggle */}
        <section className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--sidebar-border)] p-4 shadow-[var(--sidebar-ring)] shadow-md">
          <div className="flex items-center gap-2">
            {isClient && resolvedTheme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {isClient && resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
          </div>
          <Switch
            checked={isClient && resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle theme"
          />
        </section>
        {/* User Profile / Footer */}
        <footer className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--sidebar-border)] p-4 px-2 text-[var(--sidebar-foreground)] shadow-[var(--sidebar-ring)] shadow-md">
          <div className="flex w-full items-center gap-3">
            {/* User Avatar */}
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-10 w-10",
                  userButtonBox: "flex items-center gap-2",
                },
              }}
            />
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col">
                {/* Full Name */}
                <span className="truncate text-sm font-semibold text-[var(--sidebar-foreground)]">
                  {userInfo.name}
                </span>
                {/* Email */}
                {userInfo.email && (
                  <span className="truncate text-xs text-[var(--sidebar-foreground)] dark:text-[var(--sidebar-accent-foreground)]">
                    {userInfo.email}
                  </span>
                )}
                {/* Phone Number */}
                {userInfo.phone && (
                  <span className="truncate text-xs text-[var(--sidebar-foreground)] dark:text-[var(--sidebar-accent-foreground)]">
                    {userInfo.phone}
                  </span>
                )}
                {/* Google Account Link if available */}
                {userInfo.hasGoogle && (
                  <a
                    href="https://myaccount.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-[var(--sidebar-primary)] hover:underline"
                  >
                    Manage Google Account
                  </a>
                )}
              </div>
            )}
          </div>
        </footer>
      </nav>
    </aside>
  );
};

export default AppSidebar;
