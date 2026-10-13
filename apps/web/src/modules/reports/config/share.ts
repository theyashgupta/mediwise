import { getIntlTag, getT } from "@/common/hooks/use-locale";

const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

export function shareUrl(origin: string, token: string) {
  return `${origin}/share/${token}`;
}

/** Builds a WhatsApp link that opens a chat with the share URL and one line of text, so no Meta account is needed. */
export function whatsAppLink(url: string) {
  return `https://wa.me/?text=${encodeURIComponent(getT().reports.share.whatsAppText(url))}`;
}

/** Writes the day a link ends, in the reader's own time zone, because the end is an instant and not a plain date. */
export function shareDate(instant: string) {
  return new Date(instant).toLocaleDateString(getIntlTag(), dateOptions);
}

export function openedText(openCount: number, lastOpenedAt: string | null) {
  const { share } = getT().reports;
  if (openCount === 0 || !lastOpenedAt) return share.notOpened;
  return share.opened(openCount, shareDate(lastOpenedAt));
}
