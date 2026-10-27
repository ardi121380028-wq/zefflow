"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground opacity-60",
          className,
        )}
        aria-label="Toggle theme"
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Mode Gelap aktif (Klik untuk beralih ke Mode Terang)" : "Mode Terang aktif (Klik untuk beralih ke Mode Gelap)"}
      aria-label="Toggle theme"
      className={cn(
        "grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-foreground transition-all duration-200 hover:bg-muted active:scale-95 shadow-sm",
        className,
      )}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 text-violet-400 transition-transform hover:scale-110" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500 transition-transform hover:rotate-45" />
      )}
    </button>
  );
}

