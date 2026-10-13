import { FileText, House, Settings, TrendingUp, Users } from "lucide-react";
import type { FileRoutesById } from "@/routeTree.gen";

export const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const navItems = [
  { to: "/", label: "Home", icon: House, key: "h" },
  { to: "/reports", label: "Reports", icon: FileText, key: "r" },
  { to: "/trends", label: "Trends", icon: TrendingUp, key: "t" },
  { to: "/profiles", label: "Profiles", icon: Users, key: "p" },
  { to: "/settings", label: "Settings", icon: Settings, key: "s" },
] as const;

export type NavPath = (typeof navItems)[number]["to"];

type AppRouteId = Extract<keyof FileRoutesById, `/_app/${string}`>;

type Page = { title: string; parent?: AppRouteId; upload?: true };

export const pages: Record<AppRouteId, Page> = {
  "/_app/": { title: "Home", upload: true },
  "/_app/reports/": { title: "Reports", upload: true },
  "/_app/reports/upload": { title: "Upload a report", parent: "/_app/reports/" },
  "/_app/reports/$reportId": { title: "Report", parent: "/_app/reports/" },
  "/_app/reports/$reportId_/markers/$markerKey": {
    title: "Marker",
    parent: "/_app/reports/$reportId",
  },
  "/_app/trends/": { title: "Trends" },
  "/_app/trends/$markerKey": { title: "Trend", parent: "/_app/trends/" },
  "/_app/compare": { title: "Compare reports", parent: "/_app/trends/" },
  "/_app/profiles": { title: "Profiles" },
  "/_app/settings": { title: "Settings" },
  "/_app/credits": { title: "Report credits", parent: "/_app/settings" },
  "/_app/dev/kitchen-sink": { title: "Kitchen sink" },
  "/_app/design": { title: "Design" },
};

/**
 * Lists the pages from the top section down to the given page.
 */
export function pageTrail(routeId: string) {
  const trail: { id: AppRouteId; page: Page }[] = [];
  let id = routeId in pages ? (routeId as AppRouteId) : undefined;
  while (id) {
    trail.unshift({ id, page: pages[id] });
    id = pages[id].parent;
  }
  return trail;
}

/**
 * Fills the `$param` parts of a route path, such as `/reports/$reportId`.
 */
export function fillPath(path: string, params: Record<string, string | undefined>) {
  return path.replace(/\$(\w+)/g, (_, name: string) => params[name] ?? "");
}

export type Shortcut =
  | { action: "go"; to: NavPath }
  | { action: "wait-for-destination" }
  | { action: "toggle-sidebar" }
  | { action: "show-shortcuts" };

/**
 * Maps one key press to a shell shortcut.
 *
 * @remarks
 * "g" only arms the next key, so "g h" goes home and a lone "h" does nothing.
 */
export function resolveShortcut(key: string, afterG: boolean): Shortcut | undefined {
  if (afterG) {
    const item = navItems.find((nav) => nav.key === key.toLowerCase());
    return item && { action: "go", to: item.to };
  }
  if (key === "g" || key === "G") return { action: "wait-for-destination" };
  if (key === "[") return { action: "toggle-sidebar" };
  if (key === "?") return { action: "show-shortcuts" };
  return undefined;
}

/**
 * Returns true when a key press belongs to a text field, not to the shell.
 */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
