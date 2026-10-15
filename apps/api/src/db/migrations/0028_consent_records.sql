CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"policy_version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"user_agent_hash" text,
	CONSTRAINT "consent_records_kind" CHECK ("consent_records"."kind" in ('terms', 'health_data', 'assistant_review')),
	CONSTRAINT "consent_records_policy_version" CHECK ("consent_records"."policy_version" <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "consent_records_one_per_version_idx" ON "consent_records" USING btree ("user_id","kind","policy_version") WHERE "consent_records"."withdrawn_at" is null;--> statement-breakpoint
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
