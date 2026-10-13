CREATE TABLE "assistant_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" uuid NOT NULL,
	"focus_report_id" uuid,
	"question" text NOT NULL,
	"answer" jsonb NOT NULL,
	"refusal_kind" text,
	"rules" text[] DEFAULT '{}'::text[] NOT NULL,
	"model" text,
	"usage" jsonb,
	"cost_cents" double precision DEFAULT 0 NOT NULL,
	"charged" boolean DEFAULT false NOT NULL,
	"flagged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_questions_question_length" CHECK (char_length("assistant_questions"."question") <= 500)
);
--> statement-breakpoint
ALTER TABLE "assistant_questions" ADD CONSTRAINT "assistant_questions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_questions" ADD CONSTRAINT "assistant_questions_focus_report_id_reports_id_fk" FOREIGN KEY ("focus_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_questions_profile_id_created_at_idx" ON "assistant_questions" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "assistant_questions_user_id_idx" ON "assistant_questions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "assistant_questions" ENABLE ROW LEVEL SECURITY;