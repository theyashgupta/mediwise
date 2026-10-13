CREATE TYPE "public"."payment_order_status" AS ENUM('created', 'paid', 'refunded');--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pack_id" text NOT NULL,
	"credits" integer NOT NULL,
	"amount" integer NOT NULL,
	"provider_payment_id" text,
	"status" "payment_order_status" DEFAULT 'created' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD COLUMN "payment_order_id" uuid;--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD COLUMN "payment_ref" text;--> statement-breakpoint
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD CONSTRAINT "credits_ledger_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD CONSTRAINT "credits_ledger_payment_ref_unique" UNIQUE("payment_ref");--> statement-breakpoint
ALTER TABLE "payment_orders" ENABLE ROW LEVEL SECURITY;
