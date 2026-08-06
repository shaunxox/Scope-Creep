"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, Layers3, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types";

interface NavbarProps {
  userEmail?: string;
  selectedProject?: Project | null;
  onOpenCommandMenu?: () => void;
}

export function Navbar({
  userEmail,
  selectedProject,
  onOpenCommandMenu,
}: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md shadow-purple-600/30 transition-transform duration-200 group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Scope Creep
            </span>
          </Link>

          {/* Active Workspace Indicator */}
          {selectedProject ? (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-medium">
              <Layers3 className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-muted-foreground text-[11px]">Workspace:</span>
              <span className="text-foreground font-semibold text-xs truncate max-w-[150px]">
                {selectedProject.name}
              </span>
            </div>
          ) : (
            <Badge tone="warning" dot className="hidden sm:inline-flex text-[11px]">
              No workspace selected
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          {onOpenCommandMenu && (
            <button
              onClick={onOpenCommandMenu}
              className="hidden md:flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-950/20 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-colors"
            >
              <Command className="h-3.5 w-3.5" />
              <span>Search or command</span>
              <span className="font-mono text-[10px] bg-background border border-purple-500/30 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </span>
            </button>
          )}

          {/* User Email */}
          {userEmail && (
            <div className="hidden lg:block rounded-full border border-purple-500/20 bg-card px-3 py-1 text-xs text-muted-foreground font-mono">
              {userEmail}
            </div>
          )}

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
