# Contributing to MediWise

Thank you for your help. This guide explains how to change MediWise without surprises.

By contributing, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). You also agree that your work ships under the [GNU AGPL v3.0](LICENSE).

## Ways to help

- **Report a bug.** Use the bug report form. A reliable way to reproduce the bug helps most.
- **Suggest a feature.** Use the feature form. For a large change, open an issue first so that we agree on the shape.
- **Fix a marker.** A wrong range, a missing alias or an unclear explanation in `packages/engine/src/catalog` is a good first change. Every range needs a source.
- **Add tests.** Every package uses Vitest. A test next to the file it tests is always welcome.
- **Improve the docs.** A clearer step in the README or a fixed typo also counts.

## Never use real health data

Do not commit a real lab report, a real name or a real value. Use the made-up sample reports in `apps/api/fixtures/golden`. Take screenshots on an account that holds only those samples. A pull request with real personal data gets closed, and the data gets removed from history.

## Dev setup

Follow the [Quick start](README.md#quick-start) in the README. You need Node 24, pnpm 11, poppler, a free Supabase project and an Anthropic API key.

Never commit an `.env` file. Git ignores them. Each app has an `.env.example` with every variable name and a one-line comment.

## One worktree per change

Keep each change on its own branch in its own git worktree. Then two changes never share a working tree, a dev server or a `node_modules` folder.

```sh
git worktree add ../mediwise-fix-hdl-alias -b fix/hdl-alias main
cd ../mediwise-fix-hdl-alias
pnpm install
cp ../mediwise/apps/api/.env apps/api/.env
cp ../mediwise/apps/web/.env apps/web/.env
```

Copy the env files with `cp`. Do not paste their values into an issue, a commit or a chat. When the change merges, remove the worktree with `git worktree remove`.

## The check gate

One command gates every change:

```sh
pnpm check
```

| Step      | What it enforces                                                                               |
| - | - |
| Typecheck | Strict TypeScript in every package                                                             |
| Lint      | ESLint, including the import rules in [.claude/rules/structure.md](.claude/rules/structure.md) |
| Test      | Vitest in every package, including the engine fixtures                                         |

CI runs the same command on every push and every pull request. Run `pnpm format` before you commit. On a machine with 8 GB of RAM, do not run `pnpm check` and `pnpm dev` at the same time.

CI also runs the end-to-end suite after `pnpm check`: sign up, add a profile, upload a sample, open the report, the doctor export and the CSV, and sign out. It runs against a local Supabase and never calls Claude. Run it on your machine before you change a page in the main flow:

```sh
supabase start --workdir apps/e2e
pnpm e2e
supabase stop --workdir apps/e2e
```

You need Docker and the Supabase CLI. Tests find elements by `data-testid` only. [docs/testing.md](docs/testing.md) has the details.

If you change extraction or mapping, also run `pnpm eval:extraction`. It reads the two sample reports with Claude and prints every difference from their golden files. It costs about 1 US cent and stops before 1 USD.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): lowercase, imperative, no full stop at the end.

```
feat(engine): add the ferritin range for women over 50
fix(api): keep the doctor name out of the lab name
docs: explain the spend cap in the deploy guide
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. Keep the header at 100 characters or fewer. Put the reason in the body when the change needs one.

`pnpm install` adds a husky `commit-msg` hook that runs commitlint. The hook rejects a message that breaks these rules. Merge commits are exempt. Pull request titles follow the same rules, and a CI check enforces them.

## Signed commits

Every commit on `main` must carry a verified signature. An SSH key is the simplest way:

```sh
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Then add the same public key to GitHub as a **Signing key** (Settings, SSH and GPG keys). `git log --show-signature -1` shows the result. GPG keys also work. See the [GitHub guide to signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

## Code style

- Folders and imports follow [.claude/rules/structure.md](.claude/rules/structure.md). Names follow [.claude/rules/naming.md](.claude/rules/naming.md).
- Comments follow [.claude/rules/comments.md](.claude/rules/comments.md). Write a JSDoc block only for a reason that the code cannot show.
- Text that a user reads follows [.claude/rules/copy.md](.claude/rules/copy.md): sentences of 20 words or fewer, active voice, one instruction per sentence.
- Tests follow [.claude/rules/testing.md](.claude/rules/testing.md). Each test name is a sentence that states the behaviour.
- Read [docs/DECISIONS.md](docs/DECISIONS.md) before a structural change. Change a decision there before you change the code.

## Open a pull request

1. Branch off `main` in a new worktree.
2. Make one focused change.
3. Run `pnpm check` until it passes.
4. Run the change in the app and note what you saw. For a UI change, add screenshots in both themes and at 390 px.
5. Open the pull request and fill in the template. Link the issue that it closes.

CI must pass before a merge. The maintainer reviews every pull request.

## AI-assisted contributions

You can use an AI agent to write a pull request. MediWise is built that way. You must understand every line you submit and stand behind it. A pull request that is clearly unreviewed agent output gets closed.

## Scope

MediWise reads lab reports and explains them. It does not diagnose, prescribe or replace a doctor. A change that makes the app give medical advice is out of scope.
