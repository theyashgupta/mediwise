import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from "payload";

const dispatchUrl = "https://api.github.com/repos/theyashgupta/mediwise/dispatches";
const debounceMs = 5_000;

let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Sends one `cms-published` repository dispatch and logs the outcome, never throwing.
 */
async function sendDispatch(payload: Payload, token: string) {
  try {
    const response = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "mediwise-cms",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ event_type: "cms-published" }),
    });
    if (response.ok)
      payload.logger.info(`Sent the cms-published dispatch (HTTP ${response.status}).`);
    else payload.logger.error(`The cms-published dispatch failed (HTTP ${response.status}).`);
  } catch (error) {
    payload.logger.error({ err: error, msg: "The cms-published dispatch failed." });
  }
}

/**
 * Starts or restarts the trailing debounce, so a burst of publishes sends one dispatch.
 *
 * @remarks
 * The timer lives in memory. The CMS runs as one process, and a restart inside the window loses at most one rebuild.
 */
function scheduleDispatch(payload: Payload, context: Record<string, unknown>) {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token || context.skipDispatch) return;
  clearTimeout(timer);
  timer = setTimeout(() => void sendDispatch(payload, token), debounceMs);
}

/**
 * Schedules a dispatch after a publish or an unpublish, and skips a draft save.
 *
 * @remarks
 * The hook gets no draft flag. A draft saved over a published document leaves the main row published, so the row tells a draft save from an unpublish.
 */
export const dispatchOnChange: CollectionAfterChangeHook = async ({
  collection,
  context,
  doc,
  previousDoc,
  req,
}) => {
  if (doc._status === "published") {
    scheduleDispatch(req.payload, context);
  } else if (previousDoc?._status === "published") {
    const main = await req.payload.findByID({
      collection: collection.slug as "faq" | "pages",
      id: doc.id,
      draft: false,
      depth: 0,
      req,
    });
    if (main._status !== "published") scheduleDispatch(req.payload, context);
  }
  return doc;
};

/**
 * Schedules a dispatch after a published document is deleted.
 */
export const dispatchOnDelete: CollectionAfterDeleteHook = ({ context, doc, req }) => {
  if (doc._status === "published") scheduleDispatch(req.payload, context);
  return doc;
};
