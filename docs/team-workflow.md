# Team workflow — Brinca

> How the team works together day-to-day. Fill in the `[TBD]` fields in a working session with your developer before Phase 1 begins.

**Last updated:** April 15, 2026
**Status:** Template — to be completed before development starts
**Team:** Ivan (product owner) + Luis Eduardo (developer)

---

## 1. Ownership

Who owns what. Every decision has exactly one owner — the other person gives input, but the owner makes the final call.

| Area | Owner | Notes |
|---|---|---|
| Product decisions (what to build, feature scope, UX behavior) | `[TBD]` | |
| Feature specs and product docs | `[TBD]` | |
| Architecture and code decisions (how to build it) | `[TBD]` | |
| Database schema and migrations | `[TBD]` | |
| Code quality (linting, types, test coverage) | `[TBD]` | |
| App Store submission and metadata | `[TBD]` | |
| Design (Figma, visual polish, brand) | `[TBD]` | |
| DevOps (EAS, Sentry, Supabase config) | `[TBD]` | |

---

## 2. Branching and pull requests

### Branch naming
`[TBD — pick a convention. Common options:]`
- `feature/onboarding`, `fix/timer-drift`, `chore/update-deps`
- `phase-1/scaffold`, `phase-2/onboarding`
- Or: no convention, just descriptive names

### Branch strategy
`[TBD — pick one:]`
- `main` only — every PR merges to `main`, no long-lived branches
- `main` + `develop` — PRs merge to `develop`, periodic releases merge to `main`
- Other: ___

### Pull request rules
| Question | Answer |
|---|---|
| Who creates PRs? | `[TBD]` |
| Who reviews PRs? | `[TBD]` |
| Is a review required before merging, or can the author self-merge? | `[TBD]` |
| Maximum PR size (rough guideline — e.g. "one feature," "under 500 lines")? | `[TBD]` |
| Who merges — the author after approval, or the reviewer? | `[TBD]` |
| Merge strategy — squash, merge commit, or rebase? | `[TBD]` |

### Commit messages
`[TBD — pick a convention or say "no convention":]`
- Conventional commits: `feat(onboarding): add email verification screen`
- Free-form but descriptive: `Add email verification screen to onboarding`
- Other: ___

---

## 3. Definition of done

A task is "done" when all of the following are true. Check the ones that apply and remove the ones that don't.

- [ ] Code compiles without errors (`bun run typecheck`)
- [ ] Tests pass (`bun test`)
- [ ] Linter passes (`bun run lint`)
- [ ] Tested manually on a real device or simulator — golden path works
- [ ] Edge cases from the feature spec have been tested manually
- [ ] Feature spec acceptance criteria are all met
- [ ] If UI changed: visually reviewed on iPhone SE (small) and iPhone 15 Pro (large)
- [ ] If a spec was updated during implementation: the spec file has been edited to match what was actually built
- [ ] If a new table or column was added: migration file exists and `supabase gen types` was run
- [ ] PR is created and reviewed (if reviews are required per Section 2)
- [ ] `[Add your own criteria here]`

---

## 4. How open questions get answered

Every feature spec has an "Open questions" section. During development, new questions will surface. This section defines how they flow.

### Where questions are captured
`[TBD — pick one:]`
- GitHub Issues (label: `question`)
- A shared document (e.g. `docs/open-questions.md`)
- A Slack/WhatsApp thread
- Directly as comments in the feature spec's Open Questions section
- Other: ___

### Who answers
| Question type | Who answers | Response time |
|---|---|---|
| Product/UX ("should the user see X?") | `[TBD]` | `[TBD — e.g. same day, 24 hours]` |
| Technical ("should this be a separate table?") | `[TBD]` | `[TBD]` |
| Design ("what color is this button?") | `[TBD]` | `[TBD]` |

### What happens when the owner is unavailable
`[TBD — pick one:]`
- Developer makes a best-effort decision and flags it for review later
- Developer skips the task and moves to something else
- Other: ___

### When specs change during development
`[TBD — pick one:]`
- Developer updates the spec file in the same PR as the code change
- Product owner updates the spec, developer waits for the update
- Either can update; the other reviews
- Other: ___

---

## 5. Cadence

### Sync meetings
| Meeting | Frequency | Duration | Purpose |
|---|---|---|---|
| `[TBD — e.g. Daily standup]` | `[TBD]` | `[TBD]` | `[TBD]` |
| `[TBD — e.g. Weekly review]` | `[TBD]` | `[TBD]` | `[TBD]` |

### Async updates
`[TBD — how does the developer communicate progress between meetings?]`
- End-of-day message with what was done and what's next
- PR descriptions serve as the update
- Shared task board (GitHub Projects, Linear, Notion)
- Other: ___

### Phase handoffs
At the start of each build phase (per `docs/architecture/02-project-structure.md`), the team does:
- [ ] Review the phase scope together (which feature specs apply)
- [ ] Identify which open questions must be answered before work starts
- [ ] Agree on PR breakdown (how many PRs, roughly what each covers)
- [ ] `[Add your own steps here]`

---

## 6. Tools

| Purpose | Tool | Notes |
|---|---|---|
| Code hosting | `[TBD — e.g. GitHub]` | |
| Task tracking | `[TBD — e.g. GitHub Issues, Linear, Notion]` | |
| Communication | `[TBD — e.g. Slack, WhatsApp, Discord]` | |
| Design files | `[TBD — e.g. Figma]` | |
| CI/CD | EAS Build + EAS Update (per stack decision) | Already decided |
| IDE | VS Code + Claude Code (per stack decision) | Already decided |
