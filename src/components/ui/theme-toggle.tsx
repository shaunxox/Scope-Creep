"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground opacity-50">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={`Current theme: ${theme}. Click to switch.`}
      className="h-8 w-8 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 text-indigo-400" />
      ) : theme === "light" ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Laptop className="h-4 w-4 text-sky-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
