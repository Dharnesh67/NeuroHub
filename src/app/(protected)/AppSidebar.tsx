"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users2,
  BarChart3,
  FolderGit2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreVertical,
  Sun,
  Moon,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import type { Project } from "@/type";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useProjects from "@/hooks/use-projects";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const menuItems: MenuItem[] = [
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
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { projects, projectId, setProjectId, deleteProject, isDeleting } = useProjects();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { user } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Initialize client-side state
  useEffect(() => {
    setIsMounted(true);
    const storedCollapse = window.localStorage.getItem("sidebar-collapsed");
    setIsCollapsed(storedCollapse ? storedCollapse === "true" : isMobile);
  }, [isMobile]);

  // Auto-collapse on mobile, respect user preference on desktop
  useEffect(() => {
    if (isMounted && isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile, isMounted]);

  // Persist collapse state (not on mobile)
  useEffect(() => {
    if (isMounted && !isMobile) {
      window.localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed, isMobile, isMounted]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  }, [projectToDelete, deleteProject]);

  const handleProjectSelect = useCallback((id: string) => {
    setProjectId(id);
    window.localStorage.setItem("projectId", id);
    router.push("/dashboard");
  }, [setProjectId, router]);

  const userInfo = useMemo(() => {
    if (!user) return { name: "User", email: null, phone: null, hasGoogle: false };
    
    return {
      name: user.fullName || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress || null,
      phone: user.primaryPhoneNumber?.phoneNumber || null,
      hasGoogle: !!user.externalAccounts?.find((acc) => acc.provider === "google"),
    };
  }, [user]);

  const currentTheme = useMemo(() => isMounted ? resolvedTheme : "light", [isMounted, resolvedTheme]);

  if (!isMounted) return null;

  return (
    <>
      <aside
        className={`${isCollapsed ? "w-16 min-w-[4rem] sm:w-20 sm:min-w-[5rem]" : "w-56 min-w-[14rem] sm:w-64 sm:min-w-[16rem]"} m-1 sm:m-2 flex flex-col rounded-xl border border-border bg-background text-foreground shadow-2xl transition-[width] duration-300 ease-in-out`}
        aria-label="Application sidebar"
      >
        {/* Collapse Button */}
        <div className="flex items-center justify-end px-2 pt-2">
          <button
            onClick={toggleSidebar}
            className="group rounded-full border border-border bg-background p-2 shadow-lg transition-all duration-200 hover:border-primary hover:bg-accent focus:ring-2 focus:ring-ring focus:outline-none active:scale-95 cursor-pointer"
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
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

       
   
        {/* Sidebar Content */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-2 sm:py-4">
          {/* Application Group */}
          <section 
            className="mt-2 sm:mt-4 rounded-xl border border-border p-2 shadow-md"
            aria-label="Application navigation"
          >
            {!isCollapsed && (
              <h2 className="px-2 py-1 sm:py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
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
                      className={`group flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      title={isCollapsed ? label : undefined}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground group-hover:text-accent-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      </span>
                      {!isCollapsed && (
                        <span className="truncate text-xs sm:text-sm">{label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Projects Group */}
          <section 
            className="mt-2 sm:mt-4 rounded-xl border border-border bg-card/50 p-2 sm:p-3 shadow-md"
            aria-label="Projects navigation"
          >
            {!isCollapsed && (
              <h2 className="mb-2 border-b border-border px-2 py-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Projects
              </h2>
            )}
            <ul className="space-y-1">
              {projects?.map((project) => (
                <li key={project.id}>
                  <div 
                    className="group flex items-center gap-2 sm:gap-3 rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-foreground shadow-md transition-colors duration-150 hover:animate-pulse hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-accent focus:outline-none cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleProjectSelect(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleProjectSelect(project.id);
                      }
                    }}
                  >
                    <div
                      className="flex flex-1 items-center gap-2 sm:gap-3"
                      title={isCollapsed ? project.name : undefined}
                    >
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-background text-foreground transition-colors duration-150 group-hover:bg-accent group-hover:text-accent-foreground">
                        <FolderGit2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      </span>
                      {!isCollapsed && (
                        <span className="truncate text-xs sm:text-sm font-medium">
                          {project.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`More options for ${project.name}`}
                          >
                            <MoreVertical className="h-3 w-3 sm:h-3 sm:w-3" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="my-2 sm:my-4 flex items-center justify-center">
              {!isCollapsed ? (
                <Link
                  className="flex w-full items-center justify-center gap-1 sm:gap-2 rounded-lg bg-primary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-accent focus:outline-none cursor-pointer"
                  href="/create-project"
                  aria-label="Add Project"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span>Add Project</span>
                </Link>
              ) : (
                <Link
                  href="/create-project"
                  className="flex items-center justify-center rounded-lg bg-primary p-1.5 sm:p-2 font-semibold text-primary-foreground shadow transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-accent focus:outline-none cursor-pointer"
                  aria-label="Add Project"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </section>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme Toggle */}
          <section 
            className="mt-2 sm:mt-4 flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-border p-3 sm:p-4 shadow-md"
            aria-label="Theme toggle"
          >
            <div className="flex items-center gap-2">
              {currentTheme === "dark" ? (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              )}
              {!isCollapsed && (
                <span className="text-xs sm:text-sm font-medium">
                  {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              )}
            </div>
            <Switch
              checked={currentTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label="Toggle theme"
              className="cursor-pointer"
            />
          </section>

          {/* User Profile / Footer */}
          <footer 
            className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3 rounded-xl border border-border p-3 sm:p-4 px-2 text-foreground shadow-md"
            aria-label="User profile"
          >
            <div className="flex w-full items-center gap-2 sm:gap-3">
              <UserButton
                showName={false}
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 sm:h-10 sm:w-10",
                    userButtonBox: "flex items-center gap-2",
                  },
                }}
              />
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs sm:text-sm font-semibold text-foreground">
                    {userInfo.name}
                  </span>
                  {userInfo.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {userInfo.email}
                    </span>
                  )}
                  {userInfo.phone && (
                    <span className="truncate text-xs text-muted-foreground">
                      {userInfo.phone}
                    </span>
                  )}
                  {userInfo.hasGoogle && (
                    <a
                      href="https://myaccount.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs text-primary hover:underline cursor-pointer"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!projectToDelete} 
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
              The project will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppSidebar;