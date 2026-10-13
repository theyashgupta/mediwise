import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

/**
 * Anthropic client for the report worker.
 *
 * @remarks
 * The 3 minute timeout keeps one stuck call well inside the worker's 10 minute stale-job window.
 */
export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 180_000 });
