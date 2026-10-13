# Assistant: the Ask page, citation chips and the review month

Goal: a person asks from the report page or Home, reads a short answer, and opens the exact value each sentence cites. Design: `docs/research/assistant.md`, section 7.

Scope:

1. New web module `apps/web/src/modules/assistant` and the route `/ask?report=<id>` for the active profile. Switching profile starts a new chat.
2. Report page: a button "Ask about this report" in the report header that opens `/ask?report=<id>`.
3. Home: a card "Ask about your reports" below the latest report card, with 3 suggested questions built from data, without Claude: the first move-first marker, the newest finding and the next retest date.
4. The chat: questions and answers, newest at the end. Each sentence shows its chips: marker or study name, lab name, date. A deleted report shows "Report deleted".
5. The fact card: value, unit, lab range, calibrated range, status badge, lab, date, "Open report". At 1280 px and wider it sits in a right column. Below that it opens in a bottom sheet.
6. Fixed refusal and fallback copy shows as a plain block, not as an answer. A `worry` answer shows its facts first.
7. The quota states from the research doc: "{n} questions left" at 5 or fewer, the "Use 1 credit" button, the buy and upload links, the daily cap and the paused state.
8. "This answer is wrong" on each answer. "Clear chat" in the page menu.
9. The review month: the consent checkbox before the first question, behind `VITE_ASSISTANT_REVIEW=true`. The API refuses a question from an account without consent while the flag is on.
10. `pnpm assistant:review [date]` in `apps/api`: prints the day's sample (every refusal, fallback and flagged answer, and 1 in 5 of the rest) with the cited facts, and writes `pass`, `minor` or `critical` to an `assistant_reviews` table. No profile name, no email.

Rules:

- Chips are 44 px tap targets. The input stays above the phone keyboard.
- The chat column keeps the 72 ch measure. Check 390, 768, 1024, 1440 and 1920 px.
- Strings in English and Hindi through `useT`. Answers stay English, and the Hindi interface says so once above the input.
- Tests select by `data-testid` only.
- Copy per `.claude/rules/copy.md`. Say "built to follow" and never claim that MediWise meets a law.

Acceptance:

- An e2e test with `CLAUDE_STUB=true`: ask from the report page, open a chip, go back, and the chat is still there.
- An e2e test: the quota state shows "Use 1 credit" and one tap debits one credit.
- Screenshots of `/ask` at 390, 1440 and 1920 px, light and dark, with the demo account, in `docs/design/pages`, and a row in the Pages table of `docs/DESIGN.md`.
- `pnpm check` passes.

Depends on: [assistant-grounding](assistant-grounding.md) and [assistant-quota](assistant-quota.md).

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
