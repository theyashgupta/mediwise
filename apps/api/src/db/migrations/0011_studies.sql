CREATE TABLE "studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"body_region" text,
	"findings_text" text,
	"impression_text" text,
	"family_history" text,
	"performed_at" date,
	"signed_by" text,
	"report_file_id" uuid NOT NULL,
	"page_index" integer NOT NULL,
	"film_file_id" uuid
);
--> statement-breakpoint
CREATE TABLE "study_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" double precision,
	"value_text" text,
	"unit" text,
	"printed_range" text,
	"status" "marker_status"
);
--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_report_file_id_report_files_id_fk" FOREIGN KEY ("report_file_id") REFERENCES "public"."report_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_film_file_id_report_files_id_fk" FOREIGN KEY ("film_file_id") REFERENCES "public"."report_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_measurements" ADD CONSTRAINT "study_measurements_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studies_report_id_idx" ON "studies" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "study_measurements_study_id_idx" ON "study_measurements" USING btree ("study_id");--> statement-breakpoint
ALTER TABLE "studies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_measurements" ENABLE ROW LEVEL SECURITY;