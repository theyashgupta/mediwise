import { convertLexicalToHTMLAsync } from "@payloadcms/richtext-lexical/html-async";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { Endpoint, Payload, TypedLocale } from "payload";
import { validateAnchorId } from "../blocks/anchor";

const published = { _status: { equals: "published" } } as const;

/**
 * Renders Lexical rich text to HTML, with each anchor block as an empty span that carries its id.
 */
async function toHtml(data: null | SerializedEditorState | undefined) {
  if (!data) return "";
  return convertLexicalToHTMLAsync({
    data,
    disableContainer: true,
    converters: ({ defaultConverters }) => ({
      ...defaultConverters,
      inlineBlocks: {
        anchor: ({ node }) => {
          const { anchorId } = node.fields as { anchorId?: string };
          return validateAnchorId(anchorId) === true ? `<span id="${anchorId}"></span>` : "";
        },
      },
    }),
  });
}

/**
 * Collects every published page and FAQ item of one locale, with the rich text as HTML.
 *
 * @remarks
 * The `_status` filter is required: a document that was never published comes back from `draft: false` with its draft data.
 */
export async function buildExport(payload: Payload, locale: TypedLocale) {
  const query = {
    locale,
    fallbackLocale: "en",
    draft: false,
    where: published,
    pagination: false,
    depth: 0,
  } as const;
  const [pages, faq] = await Promise.all([
    payload.find({ collection: "pages", ...query }),
    payload.find({ collection: "faq", ...query, sort: "order" }),
  ]);
  return {
    locale,
    pages: Object.fromEntries(
      await Promise.all(
        pages.docs.map(async (page) => [
          page.slug,
          {
            title: page.title,
            description: page.description ?? null,
            html: await toHtml(page.body),
            updatedAt: page.updatedAt,
          },
        ]),
      ),
    ),
    faq: await Promise.all(
      faq.docs.map(async (item) => ({
        key: item.key,
        question: item.question,
        html: await toHtml(item.answer),
      })),
    ),
  };
}

export const exportEndpoint: Endpoint = {
  path: "/content/export",
  method: "get",
  handler: async (req) => {
    const locale = req.searchParams.get("locale");
    if (locale !== "en" && locale !== "hi") {
      return Response.json({ errors: [{ message: "Locale must be en or hi." }] }, { status: 400 });
    }
    return Response.json(await buildExport(req.payload, locale), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  },
};
