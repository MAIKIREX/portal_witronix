"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Laptop, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon" | "sidebar-item";
  align?: "start" | "center" | "end";
}

export function ThemeToggle({
  className,
  variant = "pill",
  align = "end",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "system";
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const currentLabel =
    currentTheme === "light"
      ? "Claro"
      : currentTheme === "dark"
        ? "Oscuro"
        : "Sistema";

  const renderIcon = (size = "size-4") => {
    if (!mounted) {
      return <Sun className={cn(size, "text-amber-500")} />;
    }
    if (currentTheme === "system") {
      return <Laptop className={cn(size, "text-sky-500")} />;
    }
    if (currentTheme === "dark") {
      return <Moon className={cn(size, "text-[#00ffbf]")} />;
    }
    return <Sun className={cn(size, "text-amber-500")} />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "pill" ? (
            <button
              type="button"
              className={cn(
                "group flex items-center gap-2 rounded-full border border-border/80 bg-white/90 dark:bg-[#0d1926]/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-white dark:hover:bg-[#0d1926] hover:shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 select-none cursor-pointer",
                className,
              )}
              aria-label={`Tema actual: ${currentLabel}. Haz clic para cambiar entre Claro, Oscuro o Sistema`}
            >
              <span className="flex items-center justify-center">
                {renderIcon("size-3.5")}
              </span>
              <span className="tracking-tight">{currentLabel}</span>
              <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 opacity-70" />
            </button>
          ) : variant === "sidebar-item" ? (
            <button
              type="button"
              className={cn(
                "group relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none border-0 ring-0 outline-none",
                className,
              )}
              aria-label={`Tema: ${currentLabel}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center size-5 shrink-0">
                  {renderIcon("size-4")}
                </span>
                <span className="truncate font-semibold tracking-wide text-white">
                  Tema: {currentLabel}
                </span>
              </div>
              <ChevronDown className="size-3.5 text-white/60 transition-transform duration-200 group-data-[popup-open]:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                "group relative flex size-9 items-center justify-center rounded-full border border-border bg-white/80 dark:bg-[#0d1926]/75 text-foreground shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-primary/50 hover:bg-white dark:hover:bg-[#0d1926] active:scale-95 cursor-pointer select-none",
                className,
              )}
              aria-label={`Tema actual: ${currentLabel}`}
            >
              {renderIcon("size-4")}
            </button>
          )
        }
      />

      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="min-w-40 p-1.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-lg"
      >
        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Seleccionar tema
        </div>

        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            currentTheme === "light"
              ? "bg-primary/10 text-primary font-semibold"
              : "hover:bg-muted text-foreground",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Sun className="size-4 text-amber-500 shrink-0" />
            <span>Modo Claro</span>
          </div>
          {currentTheme === "light" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            currentTheme === "dark"
              ? "bg-primary/10 text-primary font-semibold"
              : "hover:bg-muted text-foreground",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Moon className="size-4 text-[#00ffbf] shrink-0" />
            <span>Modo Oscuro</span>
          </div>
          {currentTheme === "dark" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            currentTheme === "system"
              ? "bg-primary/10 text-primary font-semibold"
              : "hover:bg-muted text-foreground",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Laptop className="size-4 text-sky-500 shrink-0" />
            <span>Sistema</span>
          </div>
          {currentTheme === "system" && (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
