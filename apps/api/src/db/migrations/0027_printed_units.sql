ALTER TABLE "report_markers" ADD COLUMN "printed_value" double precision;--> statement-breakpoint
ALTER TABLE "report_markers" ADD COLUMN "printed_unit" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "date_ambiguous" boolean DEFAULT false NOT NULL;