import { z } from "zod";

export type {
  CalibratedRange,
  Coverage,
  DerivedResult,
  EngineInput,
  EngineOutput,
  EngineProfile,
  EngineValue,
  FollowUp,
  FollowUpKind,
  LabRange,
  MarkerResult,
  MarkerStatus,
  MoveFirst,
  Score,
  Tier,
  UnmappedValue,
  Unmeasured,
} from "@mediwise/engine";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  time: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const relations = ["self", "partner", "parent", "child", "sibling", "other"] as const;
export const sexes = ["male", "female", "other"] as const;
export const ancestries = [
  "south_asian",
  "east_asian",
  "european",
  "african",
  "middle_eastern",
  "hispanic",
  "mixed",
  "unknown",
] as const;
export type Relation = (typeof relations)[number];
export type Sex = (typeof sexes)[number];
export type Ancestry = (typeof ancestries)[number];

export const maxProfilesPerUser = 8;

/**
 * Date of birth as an ISO date between 1900 and today.
 *
 * @remarks
 * Allows one day ahead of UTC so a user east of UTC can enter a birth that happened today in their zone.
 */
const dateOfBirthSchema = z.iso
  .date("Enter a date of birth")
  .refine((value) => value >= "1900-01-01", "Enter a date after 1900")
  .refine(
    (value) => Date.parse(value) <= Date.now() + 86_400_000,
    "Date of birth is in the future",
  );

const profileFieldsSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(80, "Enter a name of 80 characters or fewer"),
  relation: z.enum(relations, "Choose a relation"),
  dateOfBirth: dateOfBirthSchema,
  sex: z.enum(sexes, "Choose a sex"),
  ancestry: z.enum(ancestries, "Choose an ancestry"),
  permissionConfirmed: z.boolean().optional(),
  guardianConfirmed: z.boolean().optional(),
});

export const adultAge = 18;

/**
 * Tells whether a person born on this ISO date is younger than 18 on `today`.
 *
 * @remarks
 * Compares the month and day as text, so a birthday on 29 February counts from 1 March in other years.
 */
export function isMinor(dateOfBirth: string, today = new Date()) {
  const now = today.toISOString().slice(0, 10);
  const age =
    Number(now.slice(0, 4)) -
    Number(dateOfBirth.slice(0, 4)) -
    (now.slice(5) < dateOfBirth.slice(5) ? 1 : 0);
  return age < adultAge;
}

export const permissionMessage = "Confirm that you have this person’s permission";
export const guardianMessage = "Confirm that you are this child’s parent or guardian";

/**
 * Body of `POST /profiles`. The web profile form uses the same schema.
 *
 * @remarks
 * A family member needs the owner's permission tick, and a child also needs the guardian tick. The self profile needs neither.
 */
export const profileInputSchema = profileFieldsSchema.superRefine((input, ctx) => {
  if (input.relation === "self") return;
  if (!input.permissionConfirmed) {
    ctx.addIssue({ code: "custom", path: ["permissionConfirmed"], message: permissionMessage });
  }
  if (isMinor(input.dateOfBirth) && !input.guardianConfirmed) {
    ctx.addIssue({ code: "custom", path: ["guardianConfirmed"], message: guardianMessage });
  }
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Body of `PATCH /profiles/:id`. A true consent flag records the date it was first given. */
export const profileUpdateSchema = profileFieldsSchema.partial();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const reportMimes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
] as const;
export type ReportMime = (typeof reportMimes)[number];
export const maxFileBytes = 25 * 1024 * 1024;
export const maxTotalBytes = 100 * 1024 * 1024;
export const maxFiles = 20;

export const pageClasses = [
  "lab_panel",
  "imaging_report",
  "ecg_printout",
  "examination_form",
  "pathology_report",
  "identity_document",
  "raw_image",
  "other",
] as const;
export type PageClass = (typeof pageClasses)[number];

export const studyKinds = [
  "xray",
  "ultrasound",
  "ct",
  "mri",
  "ecg",
  "examination",
  "pathology",
  "other",
] as const;
export type StudyKind = (typeof studyKinds)[number];

export const findingKinds = [
  "study_alert",
  "change",
  "link",
  "study",
  "risk",
  "good_news",
] as const;
export const findingSeverities = ["risk", "watch", "optimal"] as const;

export const reportStatuses = [
  "draft",
  "queued",
  "processing",
  "paused",
  "done",
  "failed",
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

const reportFileSchema = z.object({
  name: z.string().min(1).max(255),
  mime: z.enum(reportMimes, "Upload a PDF or photos in JPEG, PNG, HEIC or WebP"),
  size: z.number().int().positive(),
});

/**
 * The files of one report: up to 20 PDFs and photos in any mix, 25 MB each and 100 MB in total.
 *
 * @remarks
 * The web validates dropped files with this schema before upload, so its messages are written for the user.
 */
export const reportFilesSchema = z
  .array(reportFileSchema)
  .min(1, "Add a PDF or photos of your report")
  .superRefine((files, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    if (files.length > maxFiles) issue(`Upload up to ${maxFiles} files`);
    for (const file of files) {
      if (file.size > maxFileBytes) issue(`${file.name} is larger than 25 MB`);
    }
    if (files.reduce((total, file) => total + file.size, 0) > maxTotalBytes) {
      issue("These files are larger than 100 MB together");
    }
  });
export type ReportFile = z.infer<typeof reportFileSchema>;

/** Body of `POST /reports`. */
export const createReportSchema = z.object({ profileId: z.uuid(), files: reportFilesSchema });
export type CreateReportInput = z.infer<typeof createReportSchema>;

/** Body of `PATCH /me`. The name is the self profile's name. */
export const updateMeSchema = profileFieldsSchema.pick({ name: true });
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

/** Body of `DELETE /me`. The literal guards against a delete sent by mistake. */
export const deleteMeSchema = z.object({
  confirm: z.literal("DELETE", 'Type "DELETE" to confirm'),
});

export * from "./extraction.js";
export * from "./narrative.js";
