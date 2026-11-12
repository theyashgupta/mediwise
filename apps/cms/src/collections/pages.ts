import type { CollectionConfig } from "payload";
import { dispatchOnChange, dispatchOnDelete } from "../hooks/dispatch";

export const pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "_status", "updatedAt"] },
  versions: { drafts: true },
  hooks: { afterChange: [dispatchOnChange], afterDelete: [dispatchOnDelete] },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "title", type: "text", required: true, localized: true },
    { name: "description", type: "textarea", localized: true },
    { name: "body", type: "richText", localized: true },
  ],
};
