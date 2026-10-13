CREATE TABLE "deletion_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_hash" text NOT NULL,
	"scope" text NOT NULL,
	"counts" jsonb NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "permission_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "guardian_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deletion_log" ENABLE ROW LEVEL SECURITY;