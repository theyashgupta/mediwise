import type Anthropic from "@anthropic-ai/sdk";
import { type PageClass, pageClasses } from "@mediwise/shared";
import sharp from "sharp";
import { z } from "zod";
import { compactPageTexts } from "../../lib/poppler.js";
import { callTool, type ReportPage, type StepUsage } from "../extraction/index.js";

const snippetChars = 1000;
const thumbnailPixels = 768;

const classifySchema = z.object({ pages: z.array(z.enum(pageClasses)) });

const classifySystem = `You sort the pages of files from a health check. Call the classify_pages tool once, with one class per page in page order.

Classes:
- lab_panel: printed laboratory test results, such as blood, urine or hormone tests with values.
- pathology_report: a cytology, histopathology, biopsy, PAP smear or FNAC report, with a specimen and a written result. Never lab_panel.
- imaging_report: a written report of an X-ray, ultrasound, CT or MRI scan.
- ecg_printout: an ECG tracing or its printed values.
- examination_form: a medical examination or fitness form that a doctor filled in, printed or by hand.
- identity_document: a copy of an identity document, such as a passport, national ID card, driving licence, insurance card, Aadhaar, PAN or social security card.
- raw_image: an X-ray film, a scan image or a photo with no report text.
- other: anything else.`;

const classifyTool: Anthropic.Tool = {
  name: "classify_pages",
  description: "Records the class of every page, in page order.",
  input_schema: z.toJSONSchema(classifySchema) as Anthropic.Tool.InputSchema,
};

/**
 * Describes each page cheaply: the start of its text, or a small copy of its image.
 *
 * @remarks
 * Every page is described, not only the first, because an identity card can sit on any page of a scanned form.
 */
async function pageBlocks(pages: ReportPage[]) {
  const compact = compactPageTexts(pages.map((page) => ("text" in page ? page.text : "")));
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const [index, page] of pages.entries()) {
    if ("text" in page) {
      const snippet = (compact[index] ?? "").replace(/\s+/g, " ").slice(0, snippetChars);
      blocks.push({ type: "text", text: `<page ${index + 1}>\n${snippet}\n</page>` });
      continue;
    }
    const thumbnail = await sharp(page.image)
      .resize(thumbnailPixels, thumbnailPixels, { fit: "inside", withoutEnlargement: true })
      .jpeg()
      .toBuffer();
    blocks.push(
      { type: "text", text: `Page ${index + 1} is an image:` },
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: thumbnail.toString("base64") },
      },
    );
  }
  return blocks;
}

/**
 * Classifies every page of one file with one Claude call and returns one class per page.
 *
 * @remarks
 * A wrong page count gets one more call, then the read fails. Nothing is stored before every page has a class, so an identity
 * page is never kept by mistake.
 */
export async function classifyPages(pages: ReportPage[], usage: StepUsage): Promise<PageClass[]> {
  const blocks = await pageBlocks(pages);
  const ask = `This file has ${pages.length} pages. Classify each page with the classify_pages tool.`;
  let problem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const input = await callTool(
      classifyTool,
      classifySystem,
      [...blocks, { type: "text", text: problem ? `${ask}\n\n${problem}` : ask }],
      usage,
    );
    const parsed = classifySchema.safeParse(input);
    if (parsed.success && parsed.data.pages.length === pages.length) return parsed.data.pages;
    problem = parsed.success
      ? `Your previous call gave ${parsed.data.pages.length} classes. Give exactly ${pages.length}.`
      : "Your previous call was not valid. Call classify_pages with one class per page.";
  }
  throw new Error("Claude did not classify every page");
}
