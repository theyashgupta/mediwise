ALTER TABLE "assistant_questions" DROP CONSTRAINT "assistant_questions_question_length";--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "question" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "answer" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assistant_questions" ALTER COLUMN "answer" DROP NOT NULL;