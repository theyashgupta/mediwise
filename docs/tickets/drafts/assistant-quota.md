# Assistant: question quota, credit packs and the spend guard

Goal: questions cost the user a fair share of a credit, and the assistant cannot overspend. Design: `docs/research/assistant.md`, sections 5 and 6.

Scope:

1. Add `questions` to the `credit_reason` enum with a Drizzle migration.
2. Questions left, computed from the ledger and `assistant_questions`, never stored: 5 for each upload debit without a refund, plus 20 for each `questions` row, minus the charged questions.
3. `POST /me/question-packs`: under `lockUserCredits`, check `balance - waiting >= 1` like `assertCanAddReport`, then insert one ledger row (`delta = -1`, `reason = 'questions'`, `note = '20 questions'`). Answer 402 with the no-credit copy when the check fails.
4. `POST /profiles/:id/questions` answers 402 with the "Use 1 credit" copy when no question is left, before any Claude call.
5. Charge a question only when the answer has at least one cited sentence. A refusal without facts, a gate answer, a fallback and an API error stay free.
6. A daily cap of 30 questions per account in 24 hours (all outcomes count) and 6 per minute, like `reportCreateLimit`.
7. Add `assistant_questions.usage` to `isOverBudget` and to `getSpendSummary` (month total and top users). Over the cap, the route answers 503 with "The assistant is not available now. Try again later."
8. Price Sonnet 5.5 cache reads at 0.05 times input in `claude-cost.ts`, per [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).
9. `GET /me/credits` also returns questions left.

Rules:

- The ledger records packs, never single questions.
- A pack is never refunded. Questions do not expire.
- No new dependency.
- Copy per `.claude/rules/copy.md`, strict mode, English and Hindi for the web strings.

Acceptance:

- A test: two parallel pack requests with a balance of 1 debit one credit.
- A test: a queued report keeps its credit when the user takes a pack.
- A test: a deleted report keeps its 5 free questions.
- A test: a fallback answer leaves questions left unchanged.
- A spend test: an assistant question counts in the month total.
- `pnpm check` passes.

Depends on: [assistant-grounding](assistant-grounding.md).

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
