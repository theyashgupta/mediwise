import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { log } from "../middleware/logger.js";
import {
  answerSystem,
  answerTool,
  askText,
  buildContext,
  estimateTokens,
  gateQuestion,
  shownSentences,
  writeAnswer,
} from "../modules/assistant/index.js";
import { stepUsage } from "../modules/extraction/index.js";
import { stepCostCents } from "../modules/spend/index.js";
import {
  checkOutcome,
  denseProfile,
  type Outcome,
  redTeam,
  workupProfile,
} from "./assistant-red-team.js";

const capCents = 100;

/**
 * Runs the 30 red-team questions on the two made-up profiles and prints the pass rate per question, the first-try
 * rate, the rejection rules, the cost and the measured context size.
 *
 * @remarks
 * The profiles are built in memory, so it needs no database. Every run calls Claude, so it never runs in CI, and it
 * stops past $1.
 */
async function evalAssistant() {
  const runs = Number(process.argv[2] ?? 3);
  const model = process.argv[3] ?? env.ANTHROPIC_ASSISTANT_MODEL;
  const only = process.argv[4]?.split(",").map(Number);
  const questions = redTeam.filter(({ number }) => !only || only.includes(number));
  const contexts = { dense: buildContext(denseProfile()), workup: buildContext(workupProfile()) };
  const counter = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  for (const [name, context] of Object.entries(contexts)) {
    const { input_tokens: tokens } = await counter.messages.countTokens({
      model,
      system: answerSystem,
      tools: [answerTool],
      messages: [{ role: "user", content: [{ type: "text", text: context.text }] }],
    });
    const system = await counter.messages.countTokens({
      model,
      system: answerSystem,
      tools: [answerTool],
      messages: [{ role: "user", content: "x" }],
    });
    log.info(
      `profile ${name}: ${context.refs.size} references, ${context.text.length} characters, estimate ${estimateTokens(context.text)} tokens, counted ${tokens - system.input_tokens} tokens for the block and ${system.input_tokens} for the system prompt and tool`,
    );
  }

  let spent = 0;
  let calls = 0;
  let firstTry = 0;
  const passes = new Map<number, number>();
  const reasons = new Map<string, number>();
  for (let run = 1; run <= runs; run++) {
    for (const item of questions) {
      if (spent > capCents) {
        log.error(`stopped: ${spent.toFixed(2)} cents spent, over the ${capCents} cent cap`);
        process.exitCode = 1;
        return;
      }
      const gated = gateQuestion(item.question);
      let outcome: Outcome;
      if (gated) {
        outcome = { kind: "gate", refuseKind: gated, sentences: [] };
      } else {
        const usage = stepUsage(model);
        const { input, problems } = await writeAnswer(
          contexts[item.profile],
          askText(item.question, []),
          usage,
        );
        const cost = stepCostCents(usage);
        spent += cost;
        calls++;
        if (input && problems.length === 0) firstTry++;
        for (const { rule } of problems) reasons.set(rule, (reasons.get(rule) ?? 0) + 1);
        outcome = input
          ? { kind: input.kind, refuseKind: input.refuseKind, sentences: shownSentences(input) }
          : { kind: "fallback", sentences: [] };
        for (const { rule, message } of problems)
          log.info(`  #${item.number} rejected ${rule}: ${message}`);
      }
      const failure = checkOutcome(item, outcome);
      if (!failure) passes.set(item.number, (passes.get(item.number) ?? 0) + 1);
      const said = outcome.sentences
        .map(({ text, cites }) => `${text} {${cites.join(", ")}}`)
        .join(" ");
      log.info(
        `run ${run} #${item.number} ${failure ? `FAIL ${failure}` : "pass"} [${outcome.kind}${outcome.refuseKind ? `:${outcome.refuseKind}` : ""}] ${said}`,
      );
    }
  }
  const passed = questions.filter(({ number }) => passes.get(number) === runs).length;
  for (const { number, question } of questions) {
    log.info(`#${number} ${passes.get(number) ?? 0}/${runs} ${question}`);
  }
  log.info(`model ${model}: ${passed}/${questions.length} questions passed every run`);
  log.info(`first try ${firstTry}/${calls} Claude answers`);
  log.info(
    `rules hit: ${[...reasons].map(([rule, count]) => `${rule}=${count}`).join(" ") || "none"}`,
  );
  log.info(
    `total cost ${spent.toFixed(3)} cents, ${(spent / Math.max(calls, 1)).toFixed(3)} cents per Claude answer`,
  );
  if (passed !== questions.length) process.exitCode = 1;
}

await evalAssistant();
