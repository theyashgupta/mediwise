CREATE TYPE "public"."follow_up_kind" AS ENUM('retest', 'supplement', 'measure');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."marker_status" AS ENUM('optimal', 'watch', 'risk');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('pdf', 'photos');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('apex', 'platinum', 'gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"kind" "follow_up_kind" NOT NULL,
	"marker_key" text,
	"title" text NOT NULL,
	"why" text NOT NULL,
	"next_action" text NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marker_alias_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_marker_id" uuid NOT NULL,
	"raw_name" text NOT NULL,
	"unit" text,
	"suggested_marker_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"relation" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"sex" text NOT NULL,
	"ancestry" text NOT NULL,
	"is_self" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"page_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_markers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"marker_key" text,
	"raw_name" text NOT NULL,
	"value" double precision,
	"value_text" text,
	"unit" text,
	"lab_range_low" double precision,
	"lab_range_high" double precision,
	"status" "marker_status",
	"calibrated_low" double precision,
	"calibrated_high" double precision,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" "report_status" DEFAULT 'queued' NOT NULL,
	"lab_name" text,
	"collected_at" date,
	"reported_at" date,
	"source_kind" "source_kind" NOT NULL,
	"score" integer,
	"tier" "tier",
	"coverage" integer,
	"verdict" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marker_alias_suggestions" ADD CONSTRAINT "marker_alias_suggestions_report_marker_id_report_markers_id_fk" FOREIGN KEY ("report_marker_id") REFERENCES "public"."report_markers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_markers" ADD CONSTRAINT "report_markers_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "profiles_owner_user_id_idx" ON "profiles" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_self_per_owner_idx" ON "profiles" USING btree ("owner_user_id") WHERE "profiles"."is_self";--> statement-breakpoint
CREATE INDEX "report_markers_report_id_idx" ON "report_markers" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "reports_profile_id_idx" ON "reports" USING btree ("profile_id");