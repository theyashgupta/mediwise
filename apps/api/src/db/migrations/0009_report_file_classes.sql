ALTER TABLE "report_files" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN IF NOT EXISTS "sha256" text;--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN IF NOT EXISTS "page_classes" text[];--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN IF NOT EXISTS "skip_reason" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_files_sha256_idx" ON "report_files" USING btree ("sha256");