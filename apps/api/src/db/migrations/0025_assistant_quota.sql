ALTER TYPE "public"."credit_reason" ADD VALUE 'questions';--> statement-breakpoint
ALTER TABLE "assistant_questions" DROP CONSTRAINT "assistant_questions_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_questions" ADD COLUMN "cleared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assistant_questions" ADD CONSTRAINT "assistant_questions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;