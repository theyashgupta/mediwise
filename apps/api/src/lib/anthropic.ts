import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

type MessagesClient = {
  messages: {
    create(body: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
};

/**
 * Anthropic client for the report worker, or the golden-file stub when `CLAUDE_STUB` is set.
 *
 * @remarks
 * The 3 minute timeout keeps one stuck call well inside the worker's 10 minute stale-job window.
 * The stub is imported only when set, so production never loads the fixtures.
 */
export const anthropic: MessagesClient = env.CLAUDE_STUB
  ? (await import("./anthropic-stub.js")).claudeStub
  : new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 180_000 });
