import type { Payload } from "payload";
import { seedFaq, seedPages } from "./content";

type Admin = { email: string; password: string };

const context = { skipDispatch: true };

/**
 * Creates the admin user, the five pages and the FAQ items when they are missing.
 *
 * @remarks
 * A document that exists is never changed, so a second run cannot overwrite an edit made in the admin.
 */
export async function seed(payload: Payload, admin: Admin) {
  const users = await payload.count({
    collection: "users",
    where: { email: { equals: admin.email } },
  });
  if (users.totalDocs === 0) {
    await payload.create({ collection: "users", data: admin });
    payload.logger.info("Created the admin user.");
  }

  const hindiPages = new Map(seedPages("hi").map((page) => [page.slug, page]));
  for (const page of seedPages("en")) {
    const existing = await payload.count({
      collection: "pages",
      where: { slug: { equals: page.slug } },
    });
    if (existing.totalDocs > 0) continue;
    const doc = await payload.create({
      collection: "pages",
      locale: "en",
      context,
      data: { ...page, _status: "published" },
    });
    const hindi = hindiPages.get(page.slug);
    if (hindi) {
      await payload.update({
        collection: "pages",
        id: doc.id,
        locale: "hi",
        context,
        data: { ...hindi, _status: "published" },
      });
    }
    payload.logger.info(`Created the page ${page.slug}.`);
  }

  const hindiFaq = new Map(seedFaq("hi").map((item) => [item.key, item]));
  for (const item of seedFaq("en")) {
    const existing = await payload.count({
      collection: "faq",
      where: { key: { equals: item.key } },
    });
    if (existing.totalDocs > 0) continue;
    const doc = await payload.create({
      collection: "faq",
      locale: "en",
      context,
      data: { ...item, _status: "published" },
    });
    const hindi = hindiFaq.get(item.key);
    if (hindi) {
      await payload.update({
        collection: "faq",
        id: doc.id,
        locale: "hi",
        context,
        data: { ...hindi, _status: "published" },
      });
    }
    payload.logger.info(`Created the FAQ item ${item.key}.`);
  }
}
