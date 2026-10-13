# User-facing text

Every string a user reads follows the `asd-ste100` skill in `.claude/skills/asd-ste100`. This covers UI labels and body copy, empty and error states, API error messages, catalog text (what a marker means, what to do), and the wording Claude is prompted to produce in narratives and doctor questions.

- Strict mode: error messages, instructions, follow-ups, anything the user acts on.
- STE-flavored mode: explanations and narrative text.
- Sentences of 20 words or fewer. Active voice. One instruction per sentence. No semicolons. No phrasal verbs. One name per thing across the whole app (pick "report", not "report" and "document").
- Keep the hedge the engine gives you. "May be low" stays "may be low". Never upgrade a hedge to a fact.
- Prompts that ask Claude for prose include these same rules in the system prompt.
- Keep medical nouns the lab prints (HbA1c, LDL). Define each once where it first appears on a page.

## Report output

The report a user reads is the main product, so it gets the strictest check:

- Engine text (verdict, move first, follow-ups, unmeasured notes) and catalog text are written in STE by hand and covered by tests.
- Claude-written prose (narrative, patterns, doctor questions) gets the copy rules in its system prompt and a validator after the call. Reject and retry once when a sentence is over 20 words, contains a semicolon, or names a marker that is not in the report. Fall back to engine text alone when the retry fails.
