"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialIsDark = saved === "dark" || saved === "light" ? saved === "dark" : prefersDark;
    setIsDark(initialIsDark);
    document.documentElement.classList.toggle("dark", initialIsDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark, mounted]);

  if (!mounted) {
    return (
      <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors">
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </button>
  );
}

