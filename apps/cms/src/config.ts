import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig, type Config } from "payload";
import { anchor } from "./blocks/anchor";
import { exportEndpoint } from "./endpoints/export";
import { faq } from "./collections/faq";
import { pages } from "./collections/pages";
import { users } from "./collections/users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const unusedFeatures = new Set(["upload", "relationship"]);

/**
 * Builds the Payload config around a database adapter.
 *
 * @remarks
 * Production passes Postgres in the `cms` schema. Tests pass a SQLite file, so CI needs no database.
 */
export function buildCmsConfig(db: Config["db"]) {
  return buildConfig({
    admin: { user: users.slug, importMap: { baseDir: dirname } },
    collections: [users, pages, faq],
    db,
    editor: lexicalEditor({
      features: ({ defaultFeatures }) => [
        ...defaultFeatures.filter((feature) => !unusedFeatures.has(feature.key)),
        BlocksFeature({ inlineBlocks: [anchor] }),
      ],
    }),
    endpoints: [exportEndpoint],
    graphQL: { disable: true },
    localization: { locales: ["en", "hi"], defaultLocale: "en", fallback: true },
    secret: process.env.PAYLOAD_SECRET ?? "",
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "",
    telemetry: false,
    typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  });
}
