ALTER TABLE "reports" DROP CONSTRAINT "reports_title_length";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "doctor_questions" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "narrative" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "translations" SET DATA TYPE text;