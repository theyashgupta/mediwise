import { expect, test } from "vitest";
import { escapeHtml, sanitizeHtml } from "./content";

test("the sanitizer keeps headings, paragraphs, lists, links, strong and em", () => {
  const html =
    '<h2>Title</h2><p>One <strong>bold</strong> and <em>soft</em> <a href="https://example.com/a">link</a>.</p><ul><li>A</li></ul><ol><li>B</li></ol>';
  expect(sanitizeHtml(html)).toBe(html);
});

test("the sanitizer drops other tags, every attribute but a safe href, and escapes a stray bracket", () => {
  expect(
    sanitizeHtml(
      '<p class="x" onclick="steal()">Hi</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.example"></iframe>',
    ),
  ).toBe("<p>Hi</p>alert(1)");
  expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
  expect(sanitizeHtml('<a href="javascript&#58;alert(1)">x</a>')).toBe("<a>x</a>");
  expect(sanitizeHtml('<a href="mailto:a@example.com" target="_blank">x</a>')).toBe(
    '<a href="mailto:a@example.com">x</a>',
  );
  expect(sanitizeHtml("<p>1 < 2 > 0</p>")).toBe("<p>1 &lt; 2 &gt; 0</p>");
});

test("plain text is escaped before it goes into HTML", () => {
  expect(escapeHtml('<b>"A" & B</b>')).toBe("&lt;b&gt;&quot;A&quot; &amp; B&lt;/b&gt;");
});
