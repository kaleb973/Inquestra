"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      title="Toggle Theme"
      aria-label="Toggle color theme"
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
