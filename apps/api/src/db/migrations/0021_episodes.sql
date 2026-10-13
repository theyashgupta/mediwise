CREATE TABLE "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"note" text,
	"summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "episodes_note_length" CHECK (char_length("episodes"."note") <= 200),
	CONSTRAINT "episodes_dates" CHECK ("episodes"."ended_on" is null or "episodes"."ended_on" >= "episodes"."started_on")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "episode_proposal_dismissed_on" date;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "episode_id" uuid;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "episodes_profile_id_idx" ON "episodes" USING btree ("profile_id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_episode_id_idx" ON "reports" USING btree ("episode_id");--> statement-breakpoint
ALTER TABLE "episodes" ENABLE ROW LEVEL SECURITY;