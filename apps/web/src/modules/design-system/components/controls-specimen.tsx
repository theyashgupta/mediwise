import { FileDown, Pencil, Printer, Share, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/common/components/controls/button";
import { Field } from "@/common/components/controls/field";
import { IconButton } from "@/common/components/controls/icon-button";
import { Input } from "@/common/components/controls/input";
import { Select, SelectItem } from "@/common/components/controls/select";
import { Textarea } from "@/common/components/controls/textarea";

const variants = [
  ["primary", "Read my report"],
  ["secondary", "Compare"],
  ["outline", "Export"],
  ["ghost", "Cancel"],
  ["destructive", "Delete report"],
  ["link", "See all trends"],
] as const;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ControlsSpecimen() {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <Row label="variant">
          {variants.map(([variant, text]) => (
            <Button key={variant} variant={variant}>
              {text}
            </Button>
          ))}
        </Row>
        <Row label="size sm, md, lg">
          <Button size="sm">Save</Button>
          <Button>
            <Upload aria-hidden />
            Upload a report
          </Button>
          <Button size="lg">Sign in</Button>
        </Row>
        <Row label="loading, disabled">
          <Button loading>Saving</Button>
          <Button variant="outline" loading>
            Loading
          </Button>
          <Button disabled>Save</Button>
          <Button variant="outline" disabled>
            Export
          </Button>
        </Row>
        <Row label="IconButton md, sm, outline">
          <IconButton label="Share this report">
            <Share aria-hidden />
          </IconButton>
          <IconButton label="Download the PDF">
            <FileDown aria-hidden />
          </IconButton>
          <IconButton label="Print" size="sm">
            <Printer aria-hidden />
          </IconButton>
          <IconButton label="Edit the profile" variant="outline">
            <Pencil aria-hidden />
          </IconButton>
        </Row>
      </div>

      <div className="grid gap-5 @lg:grid-cols-2">
        <Field label="Name" hint="MediWise shows this name on every page.">
          <Input defaultValue="Arjun Mehta" />
        </Field>
        <Field label="Email" error="Type an email address.">
          <Input type="email" defaultValue="arjun.demo@" />
        </Field>
        <Field label="Ancestry" hint="MediWise calibrates some ranges by ancestry.">
          <Select defaultValue="south-asian">
            <SelectItem value="south-asian">South Asian</SelectItem>
            <SelectItem value="east-asian">East Asian</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </Select>
        </Field>
        <Field label="Sex" error="Select a sex.">
          <Select placeholder="Select">
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </Select>
        </Field>
        <Field label="Note" hint="Only you can see this note.">
          <Textarea defaultValue="Fasting sample, taken at 8 in the morning." />
        </Field>
        <Field label="Email" hint="You cannot change your email.">
          <Input disabled defaultValue="arjun.demo@example.com" />
        </Field>
      </div>

      <Row label="Input sm, md, lg">
        <Input size="sm" aria-label="Small" placeholder="Search markers" className="w-48" />
        <Input aria-label="Medium" placeholder="Search markers" className="w-48" />
        <Input size="lg" aria-label="Large" placeholder="Search markers" className="w-48" />
      </Row>
    </div>
  );
}
