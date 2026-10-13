# Code comments

Copied verbatim from the maintainer's global rules.

- **Do NOT add comments that restate what the code already says.** No "// loop over users", no "// set x to 5".
- **Comment only the non-obvious:** a "why" decision, an edge case, a workaround, or a known gotcha. If the code is self-explanatory, write no comment.
- **JSDoc/TSDoc only on functions, methods, hooks, schemas, and validators** - never on React components, never on interfaces or type declarations, never on a plain constant, never as prose context blocks.
- **Every comment is a JSDoc block.** `//` line comments are not an accepted form for prose. If a fact is worth stating it goes in a `/** ... */` block on the construct it describes; if it cannot attach to one, delete it. Pragmas (`// eslint-disable-next-line`, `// @ts-expect-error`, `// prettier-ignore`) are exempt, the tooling requires that form.
- **Follow TSDoc:** one-line summary, blank line, then `@remarks` for the why. Never put a type in `@param`/`@returns` in a `.ts` file, the signature already declares it. Omit `@param`/`@returns` that only restate the name and type.
- **Keep it tight:** delete a comment before adding a vague one.
- **Budget the length.** The summary is one line. `@remarks` is at most 3 sentences, and only earns its place when a reviewer would otherwise ask "why is it done this way". A comment a reader has to work through is worse than no comment. If the rationale genuinely needs more than that, it belongs in the PR description or a design doc, not above the function.
- **One reason per block.** Do not stack alternatives considered, historical context, and defensive caveats into a single `@remarks`. State the decision that governs the code and stop.
- **Never narrate edits in comments** (no "// added this", "// changed per request", "// new code").
