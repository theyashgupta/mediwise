ALTER TABLE "jobs" ADD COLUMN "user_id" text;--> statement-breakpoint
CREATE INDEX "jobs_user_id_idx" ON "jobs" USING btree ("user_id");--> statement-breakpoint
UPDATE "jobs" SET "user_id" = coalesce(
  "jobs"."payload"->>'userId',
  (SELECT "profiles"."owner_user_id" FROM "reports"
    JOIN "profiles" ON "profiles"."id" = "reports"."profile_id"
    WHERE "reports"."id"::text = "jobs"."payload"->>'reportId')
);
