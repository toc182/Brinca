# Documenting an iOS app for humans and AI alike

**Two well-structured Markdown documents — a product vision doc and a functional spec — are all a two-person team needs to align on what to build and give both a human developer and an AI coding assistant the context to build it right.** The vision doc captures the *why* and *what* in roughly 2–3 pages; the functional spec captures *how the app behaves from the user's perspective* in as many pages as needed. Both should live as Markdown files in the project repository so they're always accessible to the developer, the product owner, and any AI tool working on the code. This approach — validated by practitioners at Intercom, Linear, Anthropic, and GitHub — eliminates the most expensive mistake a small team can make: building the wrong thing because context lived only in someone's head.

---

## Part 1: Product vision and context documentation

### A lean PRD is the right vehicle

For a two-person team, the ideal format is a **lean product requirements document (PRD)** — not a formal 30-page enterprise spec, not a slide deck, and not a wiki. Think of it as a single living document that answers three questions: *Who has a problem? What is the problem? How will we know we solved it?*

Linear's Head of Product, Nan Yu, organizes PRDs around three principles that work especially well for small teams: start with the highest level and get more granular, start with the widest audience and get narrower, and start with what's least likely to change and end with what's most likely to change. This means your problem statement and target users sit at the top (they rarely change), while milestones and phasing sit at the bottom (they shift constantly).

**Format recommendation: a Markdown file in your project repository** (e.g., `docs/product-vision.md`). Google Docs work fine for drafting, but Markdown in the repo means your developer and any AI coding assistant always have access without switching tools. A non-technical product owner can edit Markdown with minimal learning — it's just text with some formatting characters.

### The ten sections and how detailed each should be

Not every section carries equal weight. Here's what to include, ordered by importance for a small team, with a realistic target length for each:

| Section | Priority | Target length | Purpose |
|---|---|---|---|
| Problem statement | Essential | 2–4 sentences | Anchors every decision — prevents building the wrong thing |
| Target users | Essential | 1 paragraph + a brief persona | Makes "who is this for?" concrete and testable |
| Goals | Essential | 3–5 bullet points | Defines measurable success |
| Non-goals | Essential | 3–5 bullet points | Prevents scope creep — arguably the most critical section for a 2-person team |
| Key use cases | Essential | 3–5 narrative scenarios | Shows how real people will actually use the app |
| Constraints | Essential | Bullet list | Platform, budget, timeline, technical boundaries |
| Success metrics | Essential | 3–5 metrics | Quantifies the goals with specific numbers |
| Competitive context | Helpful | 1 paragraph | Why this instead of existing alternatives? |
| Open questions | Helpful | Bullet list | What you don't know yet (it's fine to have these) |
| Milestones / phases | Helpful | Simple ordered list | What to build first, second, third |

**Total target length: 2–3 pages.** As IntelliSoft puts it, "If you can't fit everything on one page, you're doing it wrong." That's a slight exaggeration for a doc that also needs to serve as AI context, but the spirit is right — if it takes more than 10 minutes to read, it's too long.

### What each section is and what good versus bad looks like

**Problem statement.** This is the single most important thing the product owner writes. Intercom's product team breaks it into three parts: the outcome the customer wants, why they want it, and what's painful about the status quo. The test: if your developer reads only this section, they should understand the core purpose of the app.

A bad problem statement describes a solution: *"We need to build a fitness tracking app."* A good one describes pain: *"Busy parents who want to stay active lose motivation because existing fitness apps require 10+ minutes of setup per workout. They need a way to log activity in under 30 seconds so tracking doesn't become another chore."* The difference is that the good version gives both a human and an AI the judgment to make design decisions when ambiguity arises.

**Target users.** One specific paragraph, not a generic demographic. Bad: *"Health-conscious millennials."* Good: *"Parents aged 28–42 with young children who exercised regularly before having kids but now struggle to maintain consistency. They have 15–30 minutes for exercise, use their phone as their primary device, and have tried at least one fitness app that felt too complicated."* Grounding the persona in observable behavior — not demographics — gives both human developers and AI assistants a mental model to reason about feature decisions.

**Goals and success metrics.** Goals state outcomes; metrics quantify them. Bad: *"Make the app successful."* Good: *"50 beta users actively using the app weekly within 2 months of launch. Average session duration of 90+ seconds. Onboarding completion rate above 80%."* Sequoia Capital recommends picking a single North Star Metric that represents core value delivery — for a fitness app, that might be "workouts logged per week per user." Two to three supporting metrics round it out.

**Non-goals — the section most small teams skip and most need.** This isn't a list of deprioritized features — it's a list of things you are deliberately choosing not to pursue. Ravi Mehta, former CPO of Tinder, argues that non-goals provide more clarity than goals because "the more goals you set, the less focused you become." For a two-person iOS team, typical non-goals might include: *"Android support is not a goal for V1. We will not build social features. We will not support offline mode initially. We will not optimize for iPad layout."* Every time someone says "what about adding X?" — check the non-goals list first.

**Use cases.** Write these as short narratives, not bullet points. Bad: *"User can log in. User can view dashboard."* Good: *"Sarah opens the app at 6:15 AM before the kids wake up. She taps 'Quick Log,' selects 'Yoga,' sets 20 minutes, and hits save. Total time: 8 seconds. She sees her weekly streak counter tick up to 4 days, which motivates her to keep going."* Linear's product team insists these should be "anchored in real-world examples that actually happened" — or plausible composites drawn from user research.

**Constraints.** For a two-person iOS team, this section is a critical decision-making filter. Example: *"iOS only (no Android). Swift/SwiftUI. Must support iOS 16+. No custom backend — Firebase for auth and data. Budget: $X. MVP target: 8 weeks. Must comply with App Store Review Guidelines."*

### What the product owner must define before the developer starts

The product owner's job is to define the *what* and *why* — never the *how*. As Marty Cagan of SVPG emphasizes, "Don't piss off your engineers by making the PRD a recipe rather than a guideline." Concretely, this means:

The product owner defines: the problem, target users, goals, non-goals, use cases, constraints, what screens exist, what each screen does, and what success looks like. The product owner does **not** define: database schemas, API designs, architectural patterns, or specific implementation approaches. The line is clear: describe what the user experiences, not what the code does.

Intercom enforces an internal rule worth adopting: *"Always use plain simple English, no technical terminology or codenames. Write this document as you would describe the problem to a colleague face to face."*

### How this document serves an AI coding assistant

An AI coding assistant like Claude Code is stateless — it knows nothing about your project at the start of each session. The product vision document provides the *why* context that prevents the AI from making reasonable-sounding but strategically wrong decisions. When the AI encounters ambiguity (should this button do X or Y?), the problem statement, non-goals, and use cases give it the judgment to choose correctly.

The key adaptation for AI readability: **use Markdown with clear headings, bullet points, and structured formatting rather than flowing prose.** AI tools parse hierarchical documents better than walls of text. Include concrete examples and specific numbers rather than vague qualifiers. Writing *"Display 'No workouts yet. Log your first one!' with a CTA button"* is vastly more useful to an AI than *"Show an appropriate empty state message."*

---

## Part 2: Functional specifications documentation

### What a functional spec is and why it's separate

A functional specification describes **how the product works from the user's perspective** — screens, behaviors, interactions, edge cases, error states. Joel Spolsky's classic definition: *"A functional specification describes how a product will work entirely from the user's perspective. It doesn't care how the thing is implemented."*

The distinction from the vision doc is the level of abstraction. The PRD says: *"Users need secure access to personalized data."* The functional spec says: *"The login screen shows two fields: email (valid email format, required) and password (min 8 characters, required). If credentials are invalid, display 'Invalid email or password' in red below the fields. After 5 failed attempts, display 'Account locked' with a support link."*

For a two-person team, these don't need to be physically separate documents. A single repository folder with `product-vision.md` and `functional-spec.md` (or a folder of per-feature specs) works perfectly. The important thing is that both layers exist — strategic context *and* behavioral detail.

### The right format for an iOS app: a hybrid approach

No single format covers everything a mobile app needs. The most effective approach combines four elements:

**User stories with acceptance criteria** capture feature intent. Each story follows the standard format — *"As a [user type], I want to [action] so that [benefit]"* — paired with a checklist of testable conditions that define "done." This format works exceptionally well for AI coding assistants because the acceptance criteria serve as built-in verification criteria.

**Screen-by-screen specs** eliminate ambiguity about what to build. For each screen, document: a wireframe or mockup, all interactive elements and their behavior, what data is displayed and where it comes from, and all states (loaded, loading, empty, error). This is where a product owner who also handles design has a natural advantage — annotated Figma mockups or even hand-drawn wireframes communicate more than pages of text.

**User flow diagrams** show how screens connect. Simple flowcharts with rectangles for screens, diamonds for decision points, and arrows for navigation. Tools like Figma, Whimsical, or even photos of whiteboard sketches work fine. Give each flow a descriptive name ("First-time signup flow," not "Flow 1") and design each with one user goal.

**A simple data model** defines what entities exist and their properties. This doesn't need to be a formal database schema — just a list of entities with their fields, types, and constraints. This is one element that many non-technical product owners skip but that saves enormous back-and-forth with both human developers and AI assistants.

### How granular specs should be for a two-person team

The calibration question is simple: **document every point where the developer would otherwise need to stop and ask a question.** The happy path is usually obvious — it's the edge cases, error states, and "what if" scenarios that cause rework.

For a two-person team, the spec should be more detailed than you'd expect but in a lightweight format. Skip formal headers, revision history tables, sign-off sections, and change management processes. Use visuals heavily — an annotated wireframe beats two pages of text. But don't skip edge cases, error states, or empty states, because these account for the majority of implementation time and rework.

A practical rule from Joel Spolsky: *"On any non-trivial project — more than about 1 week of coding or more than 1 programmer — if you don't have a spec, you will always spend more time and create lower quality code."* For a two-person team building an iOS app, specs are not overhead; they are the mechanism that prevents the most expensive kind of waste.

### How to document each element

**Features** are best captured as user stories with acceptance criteria. Here's a concrete example:

```
FEATURE: Quick Workout Log
User Story: As a busy parent, I want to log my workout in under
30 seconds so I can track progress without losing time.

Acceptance Criteria:
- [ ] User can tap "Log Workout" from the home screen
- [ ] Workout types displayed as tappable grid: Running, Walking, Yoga, Strength
- [ ] Duration entry via tap-to-increment in 5-minute steps
- [ ] Save confirmation appears as toast for 2 seconds
- [ ] Workout appears in Today's Activity feed immediately after save
- [ ] Works offline — syncs when connection is restored
```

This format is ideal for AI coding assistants because each criterion is a discrete, testable condition the AI can implement and verify independently.

**User flows** should be simple diagrams showing each decision point and screen transition. For an iOS app, focus on the three to five most critical journeys: onboarding/first-time use, the core value action (e.g., logging a workout), any purchase or subscription flow, and error recovery. Include decision points explicitly: *"If user has no account → sign up flow. If user has account → login flow. If user used Sign in with Apple previously → auto-login."*

**Edge cases** deserve a dedicated table per feature. For each feature, systematically ask: What if the input is empty? Invalid? What if the network is down? What if data doesn't exist? What if the user cancels mid-action? Document the expected behavior for each:

| Edge case | Expected behavior |
|---|---|
| User taps Save with no workout type selected | Disable Save button until type is selected |
| Network unavailable during save | Save locally, show "Saved offline" badge, sync when connected |
| User taps Save twice rapidly | Disable button after first tap to prevent duplicate entries |

**Screen-by-screen behavior** is the most detailed layer. For each screen, document:

```
SCREEN: Profile Settings
[Wireframe or mockup reference]

Elements:
- Avatar (circle, 80px) — tap opens photo picker (camera or library)
- Display Name (text field, max 50 chars, required)
- Email (read-only, displayed grayed out)
- "Save" button (enabled only when changes are made)
- "Delete Account" (red text, bottom of screen)

States:
- Loading: Skeleton placeholders for avatar and fields
- Error: "Couldn't load profile. Tap to retry." centered with retry button
- Default: Pre-filled with current user data

Actions:
- Save → success toast "Profile updated" → stay on screen
- Delete Account → confirmation dialog "This cannot be undone" →
  [Cancel] returns to screen, [Delete] logs out and returns to Welcome
```

**Data the app handles** should be documented as a simple entity list — not a formal database schema, but enough that a developer (or AI) knows what they're working with:

```
User
- id: UUID (auto-generated)
- email: String (required, unique, valid email)
- displayName: String (required, 1-50 characters)
- avatarURL: String (optional)
- createdAt: DateTime

Workout
- id: UUID (auto-generated)
- userId: UUID (references User)
- type: Enum [Running, Walking, Yoga, Strength]
- durationMinutes: Integer (1-999)
- date: Date
- notes: String (optional, max 500 characters)
```

**Error states and empty states** are distinct categories that need separate design treatments. A "no data yet" empty state should feel inviting and actionable (*"No workouts yet. Log your first one!"* with a prominent button). A network error should feel recoverable (*"You're offline. Changes will sync when you're back."*). A server error should feel calm (*"Something went wrong. Please try again."* with a retry button). Document the specific message text, visual treatment, and available actions for each — these details are exactly what both a human developer and AI assistant need to implement correctly without guessing.

### Keeping specs alive as the product evolves

Documentation dies when it becomes a monument instead of a tool. Five practices keep specs maintainable:

**Single ownership.** Spolsky is emphatic: the spec should be written and maintained by one person. In this team, that's the product owner. The developer reviews and flags gaps but doesn't own the document.

**Modular structure.** One section per screen or feature. When something changes, you update one section rather than rewriting the whole document. A folder of per-feature spec files (`docs/feature-specs/user-auth.md`, `docs/feature-specs/workout-log.md`) is easier to maintain than a single monolithic document.

**Living document mindset.** Update the spec as decisions are made during development, not after. When the developer says "this approach won't work, let's do Y instead," update the spec to reflect Y. The spec should always represent the team's best current understanding of the product.

**Accept imperfection.** The goal is not to document every pixel — it's to document every decision that would otherwise require a conversation. If something is obvious, skip it.

**Weekly sync.** A brief weekly review of "what changed this week" keeps the spec current. For a two-person team, this can be a 15-minute conversation, not a formal process.

### Writing specs that AI coding assistants use effectively

Research from Anthropic, GitHub (analyzing 2,500+ agent configuration files), and practitioners who build with AI assistants reveals specific patterns that make documentation more effective for AI consumption.

**Markdown with structured headings is the universal format.** Every AI coding tool — Claude Code, Cursor, GitHub Copilot — parses Markdown natively. Use headings to create hierarchy, bullet points for lists, code blocks for examples, and tables for structured data. Avoid prose-heavy paragraphs when structured formats convey the same information.

**Be specific, never vague.** Write *"Display inline error in red below the field: 'Display name is required'"* — not *"Show appropriate validation feedback."* AI assistants take instructions literally. Vague specs produce vague implementations.

**Include verification criteria for every feature.** Anthropic's documentation calls this "the single highest-leverage thing you can do" — give the AI a way to check its own work. Acceptance criteria in checkbox format serve this purpose naturally.

**Use concrete examples with realistic data.** Instead of *"Search returns relevant results,"* write *"Search for 'yoga' returns all workouts where type = Yoga, sorted by most recent first. If no results, show 'No yoga workouts yet. Log your first one!' with a 'Log Workout' button."*

**Declare boundaries explicitly.** GitHub's analysis found that the most effective documentation uses a three-tier boundary system: ✅ Always do (run tests before committing), ⚠️ Ask first (adding new dependencies), 🚫 Never do (commit API keys, modify config files). This prevents AI assistants from making well-intentioned but destructive changes.

---

## How the two documents connect and support the AI layer

The product vision doc and functional spec form a natural hierarchy. The vision doc provides strategic context — *why* the app exists, *who* it's for, and *what* success looks like. The functional spec provides behavioral detail — *how* each screen works, *what* happens in edge cases, and *what* the user sees in every state. The vision doc should be stable; the functional spec evolves constantly.

For AI coding assistants, this hierarchy maps to a specific file structure:

```
project-root/
├── CLAUDE.md                    # 60-100 lines: tech stack, commands, conventions, boundaries
├── docs/
│   ├── product-vision.md        # The "why" and "what" (2-3 pages)
│   ├── data-model.md            # Entity definitions
│   └── feature-specs/
│       ├── onboarding.md        # Screen specs, flows, edge cases
│       ├── workout-log.md       # Screen specs, flows, edge cases
│       └── profile.md           # Screen specs, flows, edge cases
```

The **CLAUDE.md file** (auto-loaded by Claude Code every session) should be short and surgical — **under 100 lines**. It contains only what the AI needs for every task: project identity, tech stack with versions, build and test commands, architectural patterns, naming conventions, and hard boundaries. Anthropic's guidance is explicit: *"For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it."* Bloated context files cause AI assistants to ignore your actual instructions.

The CLAUDE.md file then **points to the detailed docs** rather than duplicating them:

```markdown
# Documentation
- Product vision and context: see docs/product-vision.md
- Feature specs: see docs/feature-specs/
- Data model: see docs/data-model.md
Read relevant docs before starting work on related areas.
```

This "progressive disclosure" pattern — lean root context pointing to rich detail docs — is the approach recommended by both Anthropic and experienced practitioners. The AI loads only what it needs for each task, preserving its context window for actual work.

### The product owner's practical workflow

The non-technical product owner's process becomes straightforward. First, write the product vision doc in plain English — problem, users, goals, non-goals, use cases, constraints. Share it with the developer for feasibility feedback. Then, for each feature, write a spec file using the screen-by-screen format with acceptance criteria, edge cases, and state descriptions. Annotated mockups from Figma or even hand-drawn sketches add enormous clarity.

When working with an AI coding assistant, the product owner can point it to the relevant spec file: *"Read docs/feature-specs/workout-log.md and implement the Quick Log feature according to the acceptance criteria."* The AI has the strategic context from CLAUDE.md, the behavioral detail from the feature spec, and concrete verification criteria to check its work against.

## Conclusion

The entire documentation system for a two-person iOS team reduces to **two types of documents plus a short AI context file**. The product vision doc (stable, strategic, 2–3 pages) answers why and what. The functional specs (evolving, behavioral, as detailed as needed) answer how the user experiences each feature. The CLAUDE.md file (under 100 lines, always current) gives AI tools the technical compass to navigate the codebase. The product owner writes and owns all three, the developer reviews and flags gaps, and both humans and AI assistants use the same source of truth. No wiki, no ticket system, no formal process — just clear thinking captured in plain Markdown. The litmus test: if your developer can read the vision doc in 10 minutes and accurately explain what you're building, who it's for, and what's out of scope — and if an AI assistant can read a feature spec and produce a working implementation that passes every acceptance criterion — the documentation is doing its job.
