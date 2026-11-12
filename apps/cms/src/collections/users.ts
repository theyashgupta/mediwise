import type { CollectionConfig } from "payload";

export const users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email" },
  auth: { cookies: { secure: process.env.NODE_ENV === "production" } },
  fields: [],
};
