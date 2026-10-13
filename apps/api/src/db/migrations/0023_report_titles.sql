ALTER TABLE "report_files" ADD COLUMN "lab_name" text;--> statement-breakpoint
ALTER TABLE "report_markers" ADD COLUMN "report_file_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "title_edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "report_markers" ADD CONSTRAINT "report_markers_report_file_id_report_files_id_fk" FOREIGN KEY ("report_file_id") REFERENCES "public"."report_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_title_length" CHECK (char_length("reports"."title") <= 60);