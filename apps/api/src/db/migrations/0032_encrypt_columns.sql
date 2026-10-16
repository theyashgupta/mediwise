CREATE TABLE "user_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"key_id" text NOT NULL,
	"wrapped_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_keys_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "assistant_questions" DROP CONSTRAINT "assistant_questions_question_length";--> statement-breakpoint
ALTER TABLE "episodes" DROP CONSTRAINT "episodes_note_length";--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_title_length";--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "question" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "answer" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "answer" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "episodes" ALTER COLUMN "summary" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "date_of_birth" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "year_review_intro" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "doctor_questions" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "narrative" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "translations" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_keys" ENABLE ROW LEVEL SECURITY;
