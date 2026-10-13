import { FileDown, Home, Search, Settings, TrendingUp } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { PageHeader } from "@/common/components/page-header";
import { StatusBadge } from "@/common/components/status-badge";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassDialogContent,
  GlassSurface,
} from "@/common/components/surface/glass";
import { StatTile } from "@/common/components/surface/stat-tile";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const themes = ["light", "dark"] as const;

const sideNav = [
  { label: "Home", icon: Home, active: true },
  { label: "Trends", icon: TrendingUp },
  { label: "Settings", icon: Settings },
];

function Specimen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b pb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Backdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-[radial-gradient(28rem_14rem_at_10%_0%,var(--ambient-1),transparent_70%),radial-gradient(24rem_14rem_at_90%_10%,var(--ambient-2),transparent_70%)] p-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-4 top-6 space-y-2" aria-hidden>
        <div className="h-8 w-40 rounded-md bg-primary" />
        <p className="text-sm">Content under the glass shows through the blur.</p>
        <div className="h-3 w-3/4 rounded-full bg-chart-2" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Specimens() {
  return (
    <div className="space-y-12 @container">
      <Specimen title="GlassSurface: bar, surface and overlay layers">
        <Backdrop className="grid gap-3 pt-14">
          {(["bar", "surface", "overlay"] as const).map((layer) => (
            <GlassSurface key={layer} layer={layer} className="rounded-lg border px-4 py-3">
              <p className="font-mono text-sm">layer=&quot;{layer}&quot;</p>
              <p className="text-sm text-muted-foreground">Muted text passes 4.5:1 on this tint.</p>
            </GlassSurface>
          ))}
        </Backdrop>
      </Specimen>

      <Specimen title="Top bar and sidebar skin">
        <Backdrop className="h-72 p-0">
          <div className="flex h-full">
            <nav aria-label="Sample" className="w-40 shrink-0 border-r bg-glass-bar p-2">
              <ul className="space-y-0.5">
                {sideNav.map(({ label, icon: Icon, active }) => (
                  <li
                    key={label}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground",
                      active && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="min-w-0 flex-1">
              <GlassSurface
                layer="bar"
                className="flex h-12 items-center gap-2 border-b px-4 text-sm"
              >
                <span className="text-muted-foreground">Reports</span>
                <span className="text-muted-foreground">/</span>
                <span>Sunrise Diagnostics</span>
                <Search className="ml-auto size-4 text-muted-foreground" aria-hidden />
              </GlassSurface>
            </div>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen title="GlassCard">
        <Backdrop className="pt-14">
          <GlassCard>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Sign in to see your reports.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">A frame, never a result.</CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Sign in</Button>
              <GlassButton size="sm">Create an account</GlassButton>
            </CardFooter>
          </GlassCard>
        </Backdrop>
      </Specimen>

      <Specimen title="PageHeader with glass, GlassButton and GlassBadge">
        <Backdrop className="pt-14">
          <PageHeader
            glass
            title="Sunrise Diagnostics"
            description="18 May 2025 · 36 markers"
            actions={
              <GlassButton>
                <FileDown aria-hidden />
                Export for doctor
              </GlassButton>
            }
          />
          <div className="flex flex-wrap gap-2">
            <GlassBadge>Latest</GlassBadge>
            <GlassBadge>6 files</GlassBadge>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen title="GlassDialog (opens in the page theme)">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open the glass dialog</Button>
          </DialogTrigger>
          <GlassDialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard shortcuts</DialogTitle>
              <DialogDescription>Press G, then a letter, to go to a page.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </GlassDialogContent>
        </Dialog>
      </Specimen>

      <Specimen title="StatTile: always solid, results only">
        <dl
          className="grid grid-cols-2 gap-2 @lg:grid-cols-4"
          aria-label="Sample markers by status"
        >
          <StatTile label="Optimal" value={21} status="optimal" />
          <StatTile label="Watch" value={8} status="watch" />
          <StatTile label="Risk" value={7} status="risk" />
          <StatTile label="Fasting glucose" value="118" unit="mg/dL" />
        </dl>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="optimal" count={21} />
          <StatusBadge status="watch" count={8} />
          <StatusBadge status="risk" count={7} />
        </div>
      </Specimen>
    </div>
  );
}

/**
 * Turns glass off for the whole page, the same way a slow device does.
 */
function useSolidFallback() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (solid) root.dataset.glass = "off";
    else delete root.dataset.glass;
    return () => {
      delete root.dataset.glass;
    };
  }, [solid]);
  return [solid, setSolid] as const;
}

export function DesignSystem() {
  const [solid, setSolid] = useSolidFallback();
  return (
    <>
      <PageHeader
        title="Design system"
        description="Glass surfaces and tiles, in both themes. Dev builds only."
        actions={
          <Button variant="outline" aria-pressed={solid} onClick={() => setSolid(!solid)}>
            {solid ? "Show glass" : "Show the solid fallback"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {themes.map((theme) => (
          <section
            key={theme}
            data-theme={theme}
            aria-label={`${theme} theme`}
            className="min-w-0 space-y-8 rounded-xl border p-4 sm:p-6"
          >
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {theme}
            </h2>
            <Specimens />
          </section>
        ))}
      </div>
    </>
  );
}
