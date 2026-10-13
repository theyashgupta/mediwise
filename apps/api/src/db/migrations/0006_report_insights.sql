ALTER TABLE "reports" ADD COLUMN "patterns" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "doctor_questions" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "narrative" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "narrative_status" text;