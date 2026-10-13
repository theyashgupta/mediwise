CREATE TABLE "assistant_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"agreed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_consents_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "assistant_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"verdict" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_reviews_question_id_unique" UNIQUE("question_id"),
	CONSTRAINT "assistant_reviews_verdict" CHECK ("assistant_reviews"."verdict" in ('pass', 'minor', 'critical'))
);
--> statement-breakpoint
ALTER TABLE "assistant_reviews" ADD CONSTRAINT "assistant_reviews_question_id_assistant_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assistant_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assistant_reviews" ENABLE ROW LEVEL SECURITY;