const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

export function shareUrl(origin: string, token: string) {
  return `${origin}/share/${token}`;
}

/** Builds a WhatsApp link that opens a chat with the share URL and one line of text, so no Meta account is needed. */
export function whatsAppLink(url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`My lab report summary from MediWise: ${url}`)}`;
}

/** Writes the day a link ends, in the reader's own time zone, because the end is an instant and not a plain date. */
export function shareDate(instant: string) {
  return new Date(instant).toLocaleDateString("en-IN", dateOptions);
}

export function openedText(openCount: number, lastOpenedAt: string | null) {
  if (openCount === 0 || !lastOpenedAt) return "Not opened yet.";
  const times = openCount === 1 ? "1 time" : `${openCount} times`;
  return `Opened ${times}. Last opened on ${shareDate(lastOpenedAt)}.`;
}
