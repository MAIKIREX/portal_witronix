import {
  Bell,
  Building2,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@witronix/shared";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Si se indica, solo se muestra a estos roles. Sin indicar, a todos. */
  roles?: readonly Role[];
  /**
   * Modulos de la fase 2. Se dejan escritos para no rehacer la navegacion
   * despues, pero ocultos hasta que exista la pantalla: un enlace que lleva a
   * una pagina vacia es peor que no tener el enlace.
   */
  enabled: boolean;
}

const STAFF = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TECHNICIAN] as const;

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Proyectos",
    href: "/proyectos",
    icon: FolderKanban,
    enabled: true,
  },
  // --- Fase 2 ---
  {
    label: "Clientes",
    href: "/clientes",
    icon: Building2,
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    enabled: true,
  },
  {
    label: "Notificaciones",
    href: "/notificaciones",
    icon: Bell,
    enabled: true,
  },
];

export function visibleNavItems(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(
    (item) => item.enabled && (!item.roles || item.roles.includes(role)),
  );
}

export { STAFF };
