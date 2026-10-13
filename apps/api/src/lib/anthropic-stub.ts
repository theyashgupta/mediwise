import { readFileSync } from "node:fs";
import type Anthropic from "@anthropic-ai/sdk";

type GoldenMarker = {
  rawName: string;
  markerKey: string | null;
  value: number | null;
  valueText: string | null;
  unit: string | null;
};
type Golden = { sample: string; labName: string; markers: GoldenMarker[] };

const goldens = ["sample-2024", "sample-2025"].map(
  (name) =>
    JSON.parse(
      readFileSync(new URL(`../../fixtures/golden/${name}.json`, import.meta.url), "utf8"),
    ) as Golden,
);
const keyByRawName = new Map(
  goldens.flatMap(({ markers }) => markers.map((m) => [m.rawName, m.markerKey] as const)),
);

function promptText(content: Anthropic.MessageParam["content"]) {
  if (typeof content === "string") return content;
  return content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("\n");
}

/**
 * Picks the golden sample whose collection year the report text prints.
 *
 * @remarks
 * The two made-up samples share a lab and test names, and differ in the printed dates.
 */
function goldenFor(text: string) {
  const golden = goldens.find(({ sample }) => text.includes(`/${/\d{4}/.exec(sample)?.[0]}`));
  if (!golden) throw new Error("The Claude stub reads only the golden samples");
  return golden;
}

/**
 * Reads the printed collection date, for example "Collection Date : 29/Mar/2025", as YYYY-MM-DD.
 *
 * @remarks
 * A fixed date keeps the profile age, and so the score, the same on every run.
 */
function collectedAt(text: string) {
  const [, day, month, year] = /Collection Date\s*:\s*(\d{2})\/(\w{3})\/(\d{4})/.exec(text) ?? [];
  if (!day || !month || !year) return undefined;
  return new Date(`${day} ${month} ${year} UTC`).toISOString().slice(0, 10);
}

/** Answers each tool the report read offers. Prose tools get no call, so the read keeps the engine text. */
function toolInput(tool: string, text: string): unknown {
  switch (tool) {
    case "classify_pages": {
      const pages = Number(/This file has (\d+) pages/.exec(text)?.[1] ?? 0);
      return { pages: Array.from({ length: pages }, () => "lab_panel") };
    }
    case "record_extraction": {
      const { labName, markers } = goldenFor(text);
      const rows = markers.map((m) => [m.rawName, m.value ?? m.valueText, m.unit, null, 1]);
      return { labName, collectedAt: collectedAt(text), panels: [{ name: null, rows }] };
    }
    case "map_markers": {
      const tests = JSON.parse(text.slice(text.indexOf("["))) as {
        index: number;
        rawName: string;
      }[];
      return {
        mappings: tests.map(({ index, rawName }) => ({
          index,
          markerKey: keyByRawName.get(rawName) ?? null,
        })),
      };
    }
    default:
      return undefined;
  }
}

export const claudeStub = {
  messages: {
    /**
     * Answers from the golden files in `fixtures/golden` in place of Claude.
     *
     * @remarks
     * It makes no network call, so the e2e suite needs no API key and pays for nothing.
     */
    async create(body: Anthropic.MessageCreateParamsNonStreaming) {
      const offered = body.tools?.[0];
      const tool = offered && "name" in offered ? offered.name : "";
      const input = toolInput(tool, body.messages.map((m) => promptText(m.content)).join("\n"));
      return {
        id: "msg_stub",
        type: "message",
        role: "assistant",
        model: body.model,
        content:
          input === undefined ? [] : [{ type: "tool_use", id: "toolu_stub", name: tool, input }],
        stop_reason: input === undefined ? "end_turn" : "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      } as Anthropic.Message;
    },
  },
};
