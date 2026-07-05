"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-9 w-[68px] shrink-0 rounded-full border border-primary/10 bg-primary/5 ${className}`}
    >
      <div className="flex h-full items-center justify-between px-2.5">
        <Moon size={14} className={isDark ? "text-primary" : "text-primary/30"} />
        <Sun size={14} className={!isDark ? "text-accent" : "text-primary/30"} />
      </div>
      <motion.span
        className="absolute top-1 left-1 h-7 w-7 rounded-full bg-background shadow-glass"
        animate={{ x: isDark ? 0 : 32 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
