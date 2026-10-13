CREATE TYPE "public"."credit_reason" AS ENUM('grant', 'upload', 'refund', 'purchase');--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'paused_budget' BEFORE 'done';--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE 'paused' BEFORE 'done';--> statement-breakpoint
CREATE TABLE "credits_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" "credit_reason" NOT NULL,
	"report_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "credits_ledger_user_id_idx" ON "credits_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credits_ledger_report_id_idx" ON "credits_ledger" USING btree ("report_id");
--> statement-breakpoint
ALTER TABLE "credits_ledger" ENABLE ROW LEVEL SECURITY;