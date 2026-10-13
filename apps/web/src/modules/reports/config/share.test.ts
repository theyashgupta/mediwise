import { expect, test } from "vitest";
import { openedText, shareUrl, whatsAppLink } from "./share";

test("a share URL puts the token under /share on the app origin", () => {
  expect(shareUrl("https://app.example.com", "abc_-1")).toBe(
    "https://app.example.com/share/abc_-1",
  );
});

test("the WhatsApp link carries one line of text with the encoded URL", () => {
  const link = new URL(whatsAppLink("https://app.example.com/share/abc"));
  expect(link.origin).toBe("https://wa.me");
  expect(link.searchParams.get("text")).toBe(
    "My lab report summary from MediWise: https://app.example.com/share/abc",
  );
});

test("the open count reads as not opened, one time, or many times with the last date", () => {
  expect(openedText(0, null)).toBe("Not opened yet.");
  expect(openedText(1, "2026-10-13T06:00:00Z")).toBe("Opened 1 time. Last opened on 13 Oct 2026.");
  expect(openedText(3, "2026-10-14T06:00:00Z")).toBe("Opened 3 times. Last opened on 14 Oct 2026.");
});
