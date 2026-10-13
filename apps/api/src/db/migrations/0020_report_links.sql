CREATE TABLE "report_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"earlier_report_id" uuid NOT NULL,
	"later_report_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_by" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_links_two_reports" CHECK ("report_links"."earlier_report_id" <> "report_links"."later_report_id")
);
--> statement-breakpoint
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_earlier_report_id_reports_id_fk" FOREIGN KEY ("earlier_report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_later_report_id_reports_id_fk" FOREIGN KEY ("later_report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "report_links_pair_idx" ON "report_links" USING btree ("earlier_report_id","later_report_id");--> statement-breakpoint
CREATE INDEX "report_links_later_report_id_idx" ON "report_links" USING btree ("later_report_id");--> statement-breakpoint
ALTER TABLE "report_links" ENABLE ROW LEVEL SECURITY;