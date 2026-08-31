"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "./nav-items";
import { UserMenu } from "./user-menu";

export function AppSidebar() {
  const user = useCurrentUser();
  const pathname = usePathname();
  const mainItems = visibleNavItems(user.role);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const activeIndex = mainItems.findIndex((item) => isActive(pathname, item.href));

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Función para mover el indicador activo con GSAP
  const moveIndicator = (targetIndex: number, immediate = false) => {
    if (isCollapsed) return;

    const targetEl = itemsRef.current[targetIndex];
    const container = containerRef.current;
    const indicator = indicatorRef.current;

    if (!indicator || !targetEl || !container || targetIndex === -1) {
      if (indicator && targetIndex === -1) {
        gsap.to(indicator, { opacity: 0, duration: 0.2 });
      }
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const targetY = targetRect.top - containerRect.top;

    if (immediate) {
      gsap.set(indicator, { y: targetY, opacity: 1 });
    } else {
      gsap.killTweensOf(indicator);
      gsap.to(indicator, {
        y: targetY,
        opacity: 1,
        duration: 0.42,
        ease: "power3.out",
      });
    }
  };

  // Sincronizar en cambios de ruta o carga inicial
  useEffect(() => {
    if (isCollapsed) return;

    if (isInitialMount.current) {
      moveIndicator(activeIndex, true);
      isInitialMount.current = false;
    } else {
      moveIndicator(activeIndex, false);
    }
  }, [activeIndex, isCollapsed, pathname]);

  // Recalcular posición en caso de cambio de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (!isCollapsed && activeIndex !== -1) {
        moveIndicator(activeIndex, true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, isCollapsed]);

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-[#19314d] text-white">
      {/* Cabecera / Marca Witronix */}
      <SidebarHeader className="px-4 pt-6 pb-4 flex items-center justify-center">
        <Link
          href="/dashboard"
          className="flex items-center justify-center transition-transform duration-200 hover:scale-105 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-de-witronix-color-blanco.webp"
            alt="Witronix"
            className={cn(
              "h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(73,191,229,0.35)] transition-all",
              isCollapsed && "h-7 w-7"
            )}
          />
        </Link>
      </SidebarHeader>

      {/* Lista de Navegación con Indicador Deslizante GSAP */}
      <SidebarContent className="px-0 py-3 overflow-visible">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div ref={containerRef} className="relative">
              {/* Indicador Activo Deslizante con esquinas cóncavas invertidas animadas */}
              {!isCollapsed && (
                <div
                  ref={indicatorRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 -right-[1px] w-[calc(100%+2px)] z-10 opacity-0"
                  style={{ height: 48 }}
                >
                  {/* Curva cóncava superior (Top Inverted Fillet) */}
                  <span className="pointer-events-none absolute -top-5 right-0 h-5 w-5 fill-background z-20">
                    <svg className="size-full fill-background" viewBox="0 0 20 20">
                      <path d="M20,0 L20,20 L0,20 A20,20 0 0,0 20,0 Z" />
                    </svg>
                  </span>

                  {/* Cuerpo de la pastilla activa blanca */}
                  <div className="h-12 ml-4 bg-background rounded-l-full" />

                  {/* Curva cóncava inferior (Bottom Inverted Fillet) */}
                  <span className="pointer-events-none absolute -bottom-5 right-0 h-5 w-5 fill-background z-20">
                    <svg className="size-full fill-background" viewBox="0 0 20 20">
                      <path d="M0,0 L20,0 L20,20 A20,20 0 0,0 0,0 Z" />
                    </svg>
                  </span>
                </div>
              )}

              {/* Lista de Ítems interactivos */}
              <SidebarMenu className="gap-1.5 relative z-20">
                {mainItems.map((item, index) => {
                  const active = activeIndex === index;

                  if (isCollapsed) {
                    return (
                      <SidebarMenuItem key={item.href} className="relative">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex size-10 mx-auto items-center justify-center rounded-2xl transition-all duration-200",
                                  active
                                    ? "bg-background text-[#19314d] dark:text-[#49bfe5] shadow-xs scale-105"
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                                )}
                              >
                                <item.icon className="size-5 shrink-0" />
                                <span className="sr-only">{item.label}</span>
                              </Link>
                            }
                          />
                          <TooltipContent side="right" align="center">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href} className="relative">
                      <Link
                        ref={(el) => {
                          itemsRef.current[index] = el;
                        }}
                        href={item.href}
                        onClick={() => {
                          moveIndicator(index, false);
                        }}
                        className={cn(
                          "relative z-20 flex items-center gap-3.5 h-12 text-sm transition-colors duration-300",
                          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40",
                          active
                            ? "text-[#19314d] dark:text-[#49bfe5] font-bold ml-4 pl-4.5 pr-4"
                            : "text-white/85 hover:text-white mx-4 px-4.5 font-medium hover:bg-white/10 rounded-full"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-5 shrink-0 transition-colors duration-300",
                            active
                              ? "text-[#19314d] dark:text-[#49bfe5]"
                              : "text-white/80 group-hover:text-white"
                          )}
                        />
                        <span className="truncate tracking-wide">{item.label}</span>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Pie de Barra Lateral */}
      <SidebarFooter className="p-3 pt-2">
        <UserMenu />
        {!isCollapsed && (
          <div className="pt-2 pb-1 text-center text-[10px] text-white/50 tracking-wider font-medium select-none">
            WITRONIX LED · PORTAL
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * `/dashboard` solo se marca activo en la coincidencia exacta; el resto tambien
 * en sus subrutas, para que "Proyectos" siga resaltado dentro del detalle de
 * un proyecto.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
