ALTER TABLE "episodes" DROP CONSTRAINT "episodes_note_length";--> statement-breakpoint
ALTER TABLE "episodes" ALTER COLUMN "summary" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "date_of_birth" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "year_review_intro" SET DATA TYPE text;