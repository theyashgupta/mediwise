import type { CollectionConfig } from "payload";
import { dispatchOnChange, dispatchOnDelete } from "../hooks/dispatch";

export const faq: CollectionConfig = {
  slug: "faq",
  labels: { singular: "FAQ item", plural: "FAQ" },
  admin: { useAsTitle: "question", defaultColumns: ["question", "order", "_status", "updatedAt"] },
  defaultSort: "order",
  versions: { drafts: true },
  hooks: { afterChange: [dispatchOnChange], afterDelete: [dispatchOnDelete] },
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true },
    { name: "question", type: "text", required: true, localized: true },
    { name: "answer", type: "richText", localized: true },
    { name: "order", type: "number", required: true },
  ],
};
