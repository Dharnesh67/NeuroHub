"use client";
import React, { useMemo, useState } from "react";
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
import { usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

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

const projects = [
  { id: 1, name: "Project Alpha" },
  { id: 2, name: "Project Beta" },
  { id: 3, name: "Project Gamma" },
  { id: 4, name: "Project Delta" },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("sidebar-collapsed");
      return stored === "true";
    }
    return false;
  });
  const { user } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Auto-collapse on mobile, expand on desktop
  React.useEffect(() => {
    if (isMobile) setIsCollapsed(true);
    else {
      const stored = window.localStorage.getItem("sidebar-collapsed");
      setIsCollapsed(stored === "true");
    }
  }, [isMobile]);

  // Persist collapse state (not on mobile)
  React.useEffect(() => {
    if (!isMobile) {
      window.localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Memoize user info for performance
  const userInfo = useMemo(() => {
    if (!user) return { name: "User", email: null, phone: null, hasGoogle: false };
    return {
      name: user.fullName || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress || null,
      phone: user.primaryPhoneNumber?.phoneNumber || null,
      hasGoogle: !!user.externalAccounts?.find(acc => acc.provider === "google"),
    };
  }, [user]);

  return (
    <aside className={`${isCollapsed ? "w-20 min-w-[5rem]" : "w-64 min-w-[16rem]"} transition-[width] duration-500 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-[var(--sidebar-border)] border shadow-2xl flex flex-col rounded-xl m-2`}>
      {/* Collapse Button */}
      <div className="flex items-center justify-end px-2 pt-2">
        <button
          onClick={toggleSidebar}
          className={`
            group
            rounded-full
            border
            border-[var(--sidebar-border)]
            bg-[var(--sidebar)]
            p-2
            shadow-lg
            transition-all
            duration-200
            hover:bg-[var(--sidebar-accent)]
            hover:border-[var(--sidebar-primary)]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--sidebar-ring)]
            active:scale-95
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          tabIndex={0}
          onKeyDown={e => {
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
      <div className="flex items-center gap-3 border-b border-[var(--sidebar-border)] px-6 py-5">
        <Image src="/logo.svg" alt="NeuroHub logo" width={36} height={36} priority />
        {!isCollapsed && (
          <span className="text-2xl font-extrabold text-[var(--sidebar-foreground)] tracking-tight">
            NeuroHub
          </span>
        )}
      </div>
      
      {/* Sidebar Content */}
      <nav className="flex-1 flex flex-col overflow-y-auto px-2 py-4">
        {/* Application Group */}
        <section className="mt-4 p-2 border border-[var(--sidebar-border)] rounded-xl shadow-md shadow-[var(--sidebar-ring)]">
          {!isCollapsed && (
            <h2 className="px-2 py-2 text-xs font-semibold text-[var(--sidebar-accent-foreground)] tracking-widest uppercase">
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
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors
                      ${
                        isActive
                          ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow"
                          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                      }
                    `}
                    title={isCollapsed ? label : undefined}
                    tabIndex={0}
                  >
                    <span
                      className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors
                        ${
                          isActive
                            ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                            : "bg-[var(--sidebar)] text-[var(--sidebar-foreground)] group-hover:text-[var(--sidebar-accent-foreground)]"
                        }
                      `}
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
        <section className="mt-4 p-2 border border-[var(--sidebar-border)] rounded-xl shadow-md shadow-[var(--sidebar-ring)]">
          {!isCollapsed && (
            <h2 className="px-2 py-2 text-xs font-semibold text-[var(--sidebar-accent-foreground)] tracking-widest uppercase">
              Projects
            </h2>
          )}
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] transition-colors cursor-pointer"
                  title={isCollapsed ? project.name : undefined}
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-md bg-[var(--sidebar)] text-[var(--sidebar-foreground)] group-hover:text-[var(--sidebar-accent-foreground)]">
                    <FolderGit2 className="h-5 w-5" />
                  </span>
                  {!isCollapsed && <span className="truncate">{project.name}</span>}
                </div>
              </li>
            ))}
          </ul>
          {!isCollapsed ? (
            <div className="flex justify-center items-center my-3 ">
              <Link
                className="w-full flex items-center justify-center gap-2 px-3 py-2 cursor-pointer rounded-lg bg-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-primary-foreground)] font-semibold shadow transition-colors"
                aria-label="Add Project"
                href="/Create-project"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project</span>
              </Link>
            </div>
          ) : (
            <div className="flex justify-center items-center my-3">
              <Button
                className="w-full flex items-center justify-center p-2 rounded-lg bg-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-primary-foreground)] font-semibold shadow transition-colors"
                aria-label="Add Project"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
        
        
        {/* Spacer */}
        <div className="flex-1" />
         {/* Theme Toggle */}
         <section className="mt-4 p-4 border border-[var(--sidebar-border)] rounded-xl shadow-md shadow-[var(--sidebar-ring)] flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            {resolvedTheme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
          </div>
          <Switch
            checked={resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle theme"
          />
        </section>
        {/* User Profile / Footer */}
        <footer className="border border-[var(--sidebar-border)] rounded-xl shadow-md shadow-[var(--sidebar-ring)] mt-6 p-4 text-[var(--sidebar-foreground)] px-2 flex items-center gap-3">
          <div className="flex items-center gap-3 w-full">
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
              <div className="flex flex-col min-w-0">
                {/* Full Name */}
                <span className="font-semibold text-[var(--sidebar-foreground)] text-sm truncate">
                  {userInfo.name}
                </span>
                {/* Email */}
                {userInfo.email && (
                  <span className="text-xs text-[var(--sidebar-foreground)] dark:text-[var(--sidebar-accent-foreground)] truncate">
                    {userInfo.email}
                  </span>
                )}
                {/* Phone Number */}
                {userInfo.phone && (
                  <span className="text-xs text-[var(--sidebar-foreground)] dark:text-[var(--sidebar-accent-foreground)] truncate">
                    {userInfo.phone}
                  </span>
                )}
                {/* Google Account Link if available */}
                {userInfo.hasGoogle && (
                  <a
                    href="https://myaccount.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--sidebar-primary)] hover:underline mt-1"
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