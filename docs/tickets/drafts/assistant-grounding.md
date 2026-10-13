# Assistant: grounded answers and the answer validator (backend)

Goal: the API answers a question about one profile's reports with 1 to 5 cited sentences, and never lets a diagnosis, a treatment or an invented number reach the user. Design: `docs/research/assistant.md`, sections 1 to 4.

Scope:

1. Change `docs/PRODUCT.md` first: move "chat" out of the "Out of v1" list as "Questions about your own reports". Add an Assistant row to `docs/DECISIONS.md`: `claude-haiku-5-5`, thinking off, one tool call, the validator, the fixed refusal copy. Get the maintainer's approval on both in the pull request.
2. New API module `apps/api/src/modules/assistant` (routes, service, repo, schemas). Start from `modules/health`.
3. A context builder: one text block per profile with the references `R`, `F`, `S`, `P`, `U`, `L`, `E` and `C` from the research doc, a map from each reference to its id, a fixed order so the same data gives the same bytes, and the cut order above 60,000 tokens.
4. Leave out of the context: `reports.note`, `episodes.note`, `episodes.name`, `studies.family_history`, `studies.signed_by`, `profiles.name`, `profiles.date_of_birth`, `report_files.name` and every other profile.
5. The gate before the call: fixed word lists for emergencies and dose questions. A match returns the fixed copy with no Claude call.
6. The Claude call: system prompt with the rules of `.claude/rules/copy.md` and 6 examples, a cache breakpoint after the system prompt and after the profile block, the last 3 question and answer pairs, the answer tool from the research doc, `thinkingOff` from the extraction module.
7. `validateAnswer` with every rule in the Validator rules table. Reuse `catalogNames`, `namedIn`, `alertKeys` and the settled check from `findings.service.ts`. One retry with the problems listed, then the `fallback` copy.
8. Table `assistant_questions`: id, user id, profile id (cascade on delete), focus report id (set null on delete), question, answer jsonb with report ids, refusal kind, rule names hit, model, usage jsonb, cost in cents, charged, created time. Row level security on, no policies.
9. Routes: `POST /profiles/:id/questions` (500 characters or fewer), `GET /profiles/:id/questions` (the chat, newest 50), `DELETE /profiles/:id/questions` (clear chat), `POST /questions/:id/flag` ("This answer is wrong", count only).
10. `pnpm eval:assistant [runs] [model]`: runs the 30 red-team questions on the two fixture profiles, prints the pass rate per question, the first-try rate, the rule names and the cost. It stops past $1. Never in CI.
11. Measure the context size of both fixture profiles with `messages.countTokens` and write the numbers in the research doc.
12. Add questions to the JSON data download and a question count to the deletion log.

Rules:

- Refusal and fallback copy is fixed text in the API. Claude never writes it.
- The server log holds ids, outcome, rule names, tokens and cost only. Never the question, the answer, a marker key or a value.
- The engine stays pure. Every number the model may state is in the context. The server computes no new number for the model except the engine's change between two values.
- `CLAUDE_STUB=true` answers from a fixed tool input, so `apps/e2e` needs no key.
- Copy per `.claude/rules/copy.md`, strict mode. Say "built to follow" and never claim that MediWise meets a law.

Acceptance:

- A test fills every left-out field with a marker string and fails when the string reaches the Anthropic request.
- `validateAnswer` has one test per rule, including the pattern-name and quoted-study exceptions.
- A route test: an emergency question returns the fixed copy and makes no Claude call.
- `pnpm eval:assistant 3` on `claude-haiku-5-5` passes 30 of 30. Paste the output in the pull request.
- `pnpm check` passes.

Depends on: MEDI-68 (episodes) merged. The quota ticket ([assistant-quota](assistant-quota.md)) adds charging.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
