import { Inbox, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Disclaimer } from "@/common/components/disclaimer";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { RangeBar } from "@/common/components/range-bar";
import { ScoreRing } from "@/common/components/score-ring";
import { SourceList } from "@/common/components/source-list";
import { StatusBadge } from "@/common/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const themes = ["light", "dark"] as const;

const swatches = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "sidebar", className: "bg-sidebar" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "border", className: "bg-border" },
  { name: "foreground", className: "bg-foreground" },
  { name: "muted-foreground", className: "bg-muted-foreground" },
  { name: "primary", className: "bg-primary" },
  { name: "ring", className: "bg-ring" },
  { name: "destructive", className: "bg-destructive" },
];

const statusSwatches = [
  { name: "optimal", className: "bg-optimal", soft: "bg-optimal-soft" },
  { name: "watch", className: "bg-watch", soft: "bg-watch-soft" },
  { name: "risk", className: "bg-risk", soft: "bg-risk-soft" },
  { name: "unknown", className: "bg-unknown", soft: "bg-unknown-soft" },
];

const chartSwatches = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

const sources = [
  { id: "a", title: "ICMR guidelines for lipid testing", year: 2024, url: "https://icmr.gov.in" },
  { id: "b", title: "Lab reference ranges", year: 2023 },
];

const noop = () => undefined;

function Specimen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b pb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function SampleForm() {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(noop)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Enter a name." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile name</FormLabel>
              <FormControl>
                <Input placeholder="Asha" {...field} />
              </FormControl>
              <FormDescription>Submit it empty to see the error.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">
          Save
        </Button>
      </form>
    </Form>
  );
}

function Specimens() {
  const id = useId();
  return (
    <div className="space-y-12 @container">
      <Specimen title="Surfaces and text">
        <div className="grid grid-cols-3 gap-3 @lg:grid-cols-4">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="space-y-1.5">
              <div className={`h-10 rounded-md border ${swatch.className}`} />
              <p className="font-mono text-xs text-muted-foreground">{swatch.name}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Status, for results only">
        <div className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
          {statusSwatches.map((swatch) => (
            <div key={swatch.name} className="space-y-1.5">
              <div className="flex h-10 overflow-hidden rounded-md border">
                <div className={`flex-1 ${swatch.className}`} />
                <div className={`flex-1 ${swatch.soft}`} />
              </div>
              <p className="font-mono text-xs text-muted-foreground">{swatch.name}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="optimal" />
          <StatusBadge status="watch" count={3} />
          <StatusBadge status="risk" count={1} />
          <StatusBadge status="unknown" />
        </div>
      </Specimen>

      <Specimen title="Chart series">
        <div className="flex gap-2">
          {chartSwatches.map((className, index) => (
            <div key={className} className="flex-1 space-y-1.5">
              <div className={`h-6 rounded-sm ${className}`} />
              <p className="font-mono text-xs text-muted-foreground">chart-{index + 1}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Type">
        <div className="space-y-3">
          <p className="font-display text-display">Your report, explained</p>
          <p className="text-3xl font-semibold tracking-tight">3xl Score and verdict</p>
          <p className="text-2xl font-semibold tracking-tight">2xl Section title</p>
          <p className="text-xl font-medium">xl Card title</p>
          <p className="text-lg">lg Lead text for a short summary.</p>
          <p className="text-base">base Body text. HbA1c shows your average blood sugar.</p>
          <p className="text-sm text-muted-foreground">sm Secondary text and labels.</p>
          <p className="text-xs text-muted-foreground">xs Captions and footnotes.</p>
          <p className="font-mono text-base">
            5.42 <span className="text-muted-foreground">mmol/L</span> · 138.0{" "}
            <span className="text-muted-foreground">mg/dL</span>
          </p>
        </div>
      </Specimen>

      <Specimen title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">
            <Trash2 aria-hidden />
            Delete
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="outline" aria-label="Add">
            <Plus aria-hidden />
          </Button>
        </div>
      </Specimen>

      <Specimen title="Badge and Avatar">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Avatar>
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
        </div>
      </Specimen>

      <Specimen title="Input, Label and Select">
        <div className="grid gap-4 @lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${id}-email`}>Email</Label>
            <Input id={`${id}-email`} type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-invalid`}>Invalid</Label>
            <Input id={`${id}-invalid`} aria-invalid defaultValue="not an email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-disabled`}>Disabled</Label>
            <Input id={`${id}-disabled`} disabled defaultValue="Locked" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-relation`}>Relation</Label>
            <Select defaultValue="parent">
              <SelectTrigger id={`${id}-relation`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Specimen>

      <Specimen title="Form">
        <SampleForm />
      </Specimen>

      <Specimen title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Latest report</CardTitle>
            <CardDescription>Lakeview Lab, 12 Feb 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p>42 markers read. 3 need a look.</p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Open report</Button>
            <Button size="sm" variant="ghost">
              Compare
            </Button>
          </CardFooter>
        </Card>
      </Specimen>

      <Specimen title="Tabs, Progress, Separator and Skeleton">
        <Tabs defaultValue="markers">
          <TabsList>
            <TabsTrigger value="markers">Markers</TabsTrigger>
            <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
            <TabsTrigger value="unmeasured">Unmeasured</TabsTrigger>
          </TabsList>
          <TabsContent value="markers" className="text-muted-foreground">
            Markers grouped by body system.
          </TabsContent>
          <TabsContent value="follow-ups" className="text-muted-foreground">
            Retest, supplement or measure.
          </TabsContent>
          <TabsContent value="unmeasured" className="text-muted-foreground">
            Markers this panel did not test.
          </TabsContent>
        </Tabs>
        <Progress value={62} aria-label="Upload progress" />
        <Separator />
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </Specimen>

      <Specimen title="Overlays open in the page theme">
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Score is the share of markers in range.</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Open menu">
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Report</DropdownMenuLabel>
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this report?</DialogTitle>
                <DialogDescription>
                  We remove the report and its markers. You cannot undo this.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive">Delete report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>Age and sex decide the ranges we use.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button variant="outline" onClick={() => toast.success("We saved your name.")}>
            Toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("We could not read this report.")}>
            Error toast
          </Button>
        </div>
      </Specimen>

      <Specimen title="PageHeader">
        <PageHeader
          title="Reports"
          description="Every report for this profile."
          actions={<Button>Upload a report</Button>}
        />
      </Specimen>

      <Specimen title="ScoreRing">
        <div className="flex flex-wrap gap-6">
          <ScoreRing score={46} tier="Silver" className="size-28" />
          <ScoreRing score={78} tier="Gold" className="size-28" />
          <ScoreRing score={100} tier="Apex" className="size-28" />
        </div>
      </Specimen>

      <Specimen title="RangeBar">
        <div className="grid gap-8 @lg:grid-cols-2">
          <RangeBar
            value={84}
            unit="mg/dL"
            status="optimal"
            labRange={{ low: 70, high: 100 }}
            calibratedRange={{ low: 75, high: 90 }}
          />
          <RangeBar
            value={97}
            unit="mg/dL"
            status="watch"
            labRange={{ low: 70, high: 100 }}
            calibratedRange={{ low: 75, high: 90 }}
          />
          <RangeBar
            value={182}
            unit="mg/dL"
            status="risk"
            labRange={{ high: 130 }}
            calibratedRange={{ high: 100 }}
          />
          <RangeBar value={2.4} unit="mIU/L" status="unknown" />
        </div>
      </Specimen>

      <Specimen title="EmptyState">
        <EmptyState
          icon={Inbox}
          title="No reports yet"
          body="Upload a PDF or photos of a report. We explain and score every marker."
          action={<Button>Upload a report</Button>}
        />
      </Specimen>

      <Specimen title="ErrorState">
        <ErrorState message="We could not load your reports." onRetry={noop} />
      </Specimen>

      <Specimen title="LoadingState">
        <LoadingState variant="page" />
      </Specimen>

      <Specimen title="SourceList and Disclaimer">
        <SourceList sources={sources} />
        <Disclaimer />
      </Specimen>
    </div>
  );
}

export function KitchenSink() {
  return (
    <>
      <PageHeader
        title="Kitchen sink"
        description="Every primitive and common component, in both themes. Dev builds only."
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
