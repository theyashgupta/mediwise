import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_faq_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__faq_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__faq_v_published_locale" AS ENUM('en', 'hi');
  CREATE TABLE "cms"."faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_faq_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."faq_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "cms"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "cms"."_faq_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" varchar,
  	"version_order" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__faq_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "cms"."enum__faq_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "cms"."_faq_v_locales" (
  	"version_question" varchar,
  	"version_answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "cms"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "cms"."pages_locales" ADD COLUMN "description" varchar;
  ALTER TABLE "cms"."pages_locales" ADD COLUMN "body" jsonb;
  ALTER TABLE "cms"."_pages_v_locales" ADD COLUMN "version_description" varchar;
  ALTER TABLE "cms"."_pages_v_locales" ADD COLUMN "version_body" jsonb;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "faq_id" integer;
  ALTER TABLE "cms"."faq_locales" ADD CONSTRAINT "faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_faq_v" ADD CONSTRAINT "_faq_v_parent_id_faq_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."faq"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_faq_v_locales" ADD CONSTRAINT "_faq_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_faq_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "faq_key_idx" ON "cms"."faq" USING btree ("key");
  CREATE INDEX "faq_updated_at_idx" ON "cms"."faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "cms"."faq" USING btree ("created_at");
  CREATE INDEX "faq__status_idx" ON "cms"."faq" USING btree ("_status");
  CREATE UNIQUE INDEX "faq_locales_locale_parent_id_unique" ON "cms"."faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faq_locales_parent_id_idx" ON "cms"."faq_locales" USING btree ("_parent_id");
  CREATE INDEX "_faq_v_parent_idx" ON "cms"."_faq_v" USING btree ("parent_id");
  CREATE INDEX "_faq_v_version_version_key_idx" ON "cms"."_faq_v" USING btree ("version_key");
  CREATE INDEX "_faq_v_version_version_updated_at_idx" ON "cms"."_faq_v" USING btree ("version_updated_at");
  CREATE INDEX "_faq_v_version_version_created_at_idx" ON "cms"."_faq_v" USING btree ("version_created_at");
  CREATE INDEX "_faq_v_version_version__status_idx" ON "cms"."_faq_v" USING btree ("version__status");
  CREATE INDEX "_faq_v_created_at_idx" ON "cms"."_faq_v" USING btree ("created_at");
  CREATE INDEX "_faq_v_updated_at_idx" ON "cms"."_faq_v" USING btree ("updated_at");
  CREATE INDEX "_faq_v_snapshot_idx" ON "cms"."_faq_v" USING btree ("snapshot");
  CREATE INDEX "_faq_v_published_locale_idx" ON "cms"."_faq_v" USING btree ("published_locale");
  CREATE INDEX "_faq_v_latest_idx" ON "cms"."_faq_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_faq_v_locales_locale_parent_id_unique" ON "cms"."_faq_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_faq_v_locales_parent_id_idx" ON "cms"."_faq_v_locales" USING btree ("_parent_id");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "cms"."faq"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("faq_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_faq_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_faq_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cms"."faq" CASCADE;
  DROP TABLE "cms"."faq_locales" CASCADE;
  DROP TABLE "cms"."_faq_v" CASCADE;
  DROP TABLE "cms"."_faq_v_locales" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_fk";
  
  DROP INDEX "cms"."payload_locked_documents_rels_faq_id_idx";
  ALTER TABLE "cms"."pages_locales" DROP COLUMN "description";
  ALTER TABLE "cms"."pages_locales" DROP COLUMN "body";
  ALTER TABLE "cms"."_pages_v_locales" DROP COLUMN "version_description";
  ALTER TABLE "cms"."_pages_v_locales" DROP COLUMN "version_body";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "faq_id";
  DROP TYPE "cms"."enum_faq_status";
  DROP TYPE "cms"."enum__faq_v_version_status";
  DROP TYPE "cms"."enum__faq_v_published_locale";`)
}
