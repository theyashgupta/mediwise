CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cited_keys" text[] NOT NULL,
	"cited_study_ids" uuid[] NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "findings_report_id_idx" ON "findings" USING btree ("report_id");--> statement-breakpoint
ALTER TABLE "findings" ENABLE ROW LEVEL SECURITY;