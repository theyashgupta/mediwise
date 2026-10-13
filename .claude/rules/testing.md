# Testing

- Use Vitest. `pnpm test` runs every package; `pnpm check` runs it with typecheck and lint.
- Put one test file next to the file it tests: `use-health.ts` and `use-health.test.ts`.
- Test behaviour, not implementation. Assert on inputs and outputs (an HTTP response, a returned value, rendered text), never on private calls or internal state.
- Name each test as a sentence that states the behaviour: `test("an unknown path returns a 404 problem", ...)`.
- API routes: call `<feature>Routes.request(path)` or `app.request(path)`. Use `testClient` from `hono/testing` when you need typed input.
- Engine tests use fixtures in `packages/engine/fixtures/`. A fixture is a profile plus extracted markers and the expected output. Same input, same output.
- Do not mock what you own. Mock only the edge: network, Supabase, Anthropic, the clock.
- A bug fix starts with a test that fails on the bug.
