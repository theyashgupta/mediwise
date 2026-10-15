INSERT INTO "consent_records" ("user_id", "kind", "policy_version", "accepted_at")
SELECT "user_id", 'assistant_review', CASE WHEN "agreed_at" < '2026-10-15T00:00:00Z' THEN '2026-10-13' ELSE '2026-10-15' END, "agreed_at"
FROM "assistant_consents";--> statement-breakpoint
DROP TABLE "assistant_consents" CASCADE;
