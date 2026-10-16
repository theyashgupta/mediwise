CREATE TABLE "user_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"key_id" text NOT NULL,
	"wrapped_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_keys_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_keys" ENABLE ROW LEVEL SECURITY;
