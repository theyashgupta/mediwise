import { getT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";

const dayMs = 86_400_000;
const lineOctets = 75;
const encoder = new TextEncoder();

type RetestEvent = {
  profile: { id: string; name: string };
  marker: { markerKey: string; name: string; dueOn: string; measuredOn: string };
};

/** Escapes a TEXT value per RFC 5545 section 3.3.11. */
function escapeText(text: string) {
  return text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\r?\n/g, "\\n");
}

/**
 * Folds a content line so no line is longer than 75 octets, per RFC 5545 section 3.1.
 *
 * @remarks
 * The count is in UTF-8 bytes, so a name in Devanagari folds early enough. Each continuation line starts with one space.
 */
function fold(line: string) {
  const lines: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > lineOctets) {
      lines.push(current);
      current = " ";
      octets = 1;
    }
    current += char;
    octets += size;
  }
  return [...lines, current].join("\r\n");
}

function basicDate(date: string) {
  return date.replaceAll("-", "");
}

/**
 * Writes an iCalendar file with one all-day retest event on the due date.
 *
 * @remarks
 * The UID is fixed per profile, marker and date, so a second download updates the same event in the calendar.
 * The text names the report that measured the marker, which is not always the latest report.
 */
export function buildRetestCalendarFile({ profile, marker }: RetestEvent, now: Date) {
  const dayAfter = new Date(Date.parse(marker.dueOn) + dayMs).toISOString().slice(0, 10);
  const reportDay = formatPlainDate(marker.measuredOn, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const text = getT().dashboard.calendar;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MediWise//Retest dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:retest-${marker.markerKey}-${basicDate(marker.dueOn)}-${profile.id}@mediwise`,
    `DTSTAMP:${now.toISOString().replace(/[-:]|\.\d{3}/g, "")}`,
    `DTSTART;VALUE=DATE:${basicDate(marker.dueOn)}`,
    `DTEND;VALUE=DATE:${basicDate(dayAfter)}`,
    `SUMMARY:${escapeText(text.summary(marker.name, profile.name))}`,
    `DESCRIPTION:${escapeText(text.description(reportDay))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/**
 * Tells whether a due date is before today.
 *
 * @remarks
 * Today is the reader's local calendar day, compared with the plain due date as whole UTC days.
 */
export function isPastDue(dueOn: string, today: Date) {
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) > Date.parse(dueOn);
}
