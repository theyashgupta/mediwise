import { expect, test } from "vitest";
import { sanitizeHtml } from "./sanitize-html";

test("CMS text keeps its headings, paragraphs, lists, links and the anchor span", () => {
  const html =
    '<h2><span id="washington"></span>United States</h2><p>Read <strong>this</strong> and <em>that</em>.<br /></p>' +
    '<ul class="list-bullet"><li value="1"><a href="https://example.com/a" rel="noopener noreferrer" target="_blank">A</a></li></ul>' +
    '<p><a href="mailto:help@example.com">Mail</a> <a href="/terms">Terms</a> <a href="#washington">Up</a></p>';
  expect(sanitizeHtml(html)).toBe(
    '<h2><span id="washington"></span>United States</h2><p>Read <strong>this</strong> and <em>that</em>.<br></p>' +
      '<ul><li><a href="https://example.com/a">A</a></li></ul>' +
      '<p><a href="mailto:help@example.com">Mail</a> <a href="/terms">Terms</a> <a href="#washington">Up</a></p>',
  );
});

test("scripts, event handlers, styles and unknown tags are removed", () => {
  expect(
    sanitizeHtml(
      '<p style="color:red" onclick="alert(1)">Hi</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://example.com"></iframe>',
    ),
  ).toBe("<p>Hi</p>");
});

test.each([
  "javascript:alert(1)",
  "JAVASCRIPT:alert(1)",
  "java&#115;cript:alert(1)",
  "data:text/html,x",
  "//evil.example.com",
])("a link to %s loses its href", (href) => {
  expect(sanitizeHtml(`<a href="${href}">x</a>`)).toBe("<a>x</a>");
});

test("a tag split by a nested tag comes out as text, not as a tag", () => {
  expect(sanitizeHtml("<scr<script>x</script>ipt>alert(1)</script>")).toBe("alert(1)");
  expect(sanitizeHtml("<scr<b>ipt>alert(1)")).toBe("&lt;script&gt;alert(1)");
  expect(sanitizeHtml("<!-- x --><p>a</p>")).toBe("&lt;!-- x --&gt;<p>a</p>");
});

test("an id that is not a plain slug is dropped", () => {
  expect(sanitizeHtml('<span id="a b" onmouseover="x">t</span>')).toBe("<span>t</span>");
});
