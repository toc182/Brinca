# Brinca — Technical Decisions

---

## 1. Stack

### 1.1 Frontend Mobile

| Tecnología | Decisión |
|---|---|
| Framework | React Native + Expo SDK 55 (New Architecture obligatoria) |
| Lenguaje | TypeScript strict mode — sin `any`, solo interfaces |
| Navegación | Expo Router v5 (file-based, shipped with SDK 55) |
| Package manager | Bun |
| Motor JS | Hermes (por defecto en SDK 55) |
| Media (audio) | expo-audio — expo-av fue ELIMINADO en SDK 55 |
| Media (video) | expo-video — expo-av fue ELIMINADO en SDK 55 |

### 1.2 Backend y Base de Datos

| Tecnología | Decisión |
|---|---|
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions + RLS) |
| API Keys | Usar `sb_publishable_xxx` en cliente. `sb_secret_xxx` SOLO en Edge Functions. Desde el 8 de abril el endpoint OpenAPI no acepta anon key. |
| DB local | expo-sqlite — source of truth offline |
| Cache rápido | MMKV — key-value, nativo en C++ |
| Auth tokens | expo-secure-store — NUNCA AsyncStorage |
| Storage media | Supabase Storage (compatible S3) |

### 1.3 Estado y Datos

| Tecnología | Decisión |
|---|---|
| Estado servidor | TanStack Query v5 — datos Supabase, cache, sync |
| Estado cliente | Zustand v5 — UI, formularios, preferencias |
| Estado forms | React Hook Form |
| Estado local | useState/useReducer |
| Regla de oro | Si viene de Supabase → TanStack Query. Si es UI → Zustand. NUNCA mezclar. |

### 1.4 DevOps, Calidad y Herramientas

| Tecnología | Decisión |
|---|---|
| Build/Deploy | EAS Build + EAS Update con bytecode diffing. Flag `--environment` requerido en `eas update`. |
| CI/CD | EAS Workflows + GitHub Actions |
| Crash reporting | Sentry React Native SDK 8 — requiere iOS 15.0+ mínimo |
| Suscripciones | RevenueCat |
| Testing unit | Jest + React Native Testing Library |
| Testing E2E | Maestro |
| Monitoreo prod | Expo Observe (private preview) |
| IDE | VS Code + extensión nativa Claude Code |
| AI Coding | Claude Code |

> ⚠️ **COPPA — Fecha límite: 22 de abril de 2026**
> Written security program, data retention policy, consentimiento parental verificable, definición expandida de personal information. Penalidades: $51,744 por incidente por día. COPPA 2.0 aprobada en el Senado extiende protecciones a teens 13-16. Safe Harbor FTC (feb 2026): Apple Declared Age Range API y Google Play Age Signals API permiten verificar edad sin recopilar datos personales.

---

## 2. Claude Code Configuration

### 2.1 CLAUDE.md

```markdown
# Brinca (App de Seguimiento)

## Stack
React Native + Expo SDK 55 (New Architecture). TypeScript strict.
Backend: Supabase (PostgreSQL + RLS + Storage + Edge Functions).
DB local: expo-sqlite + MMKV. Routing: Expo Router v5 (file-based, SDK 55).
State: Zustand (client) + TanStack Query v5 (server) — NEVER mix.
Payments: RevenueCat. Crashes: Sentry SDK 8. Package manager: bun.

## Commands
bun install          # dependencies
bun run dev          # dev server
bun run typecheck    # tsc --noEmit (always run before finishing)
bun test             # Jest + RNTL
bun run lint         # ESLint
maestro test maestro/flows/
npx supabase db push

## Verification
After ANY change: bun run typecheck && bun test

## Structure
app/          → Expo Router routes: (auth)/ and (app)/(tabs)/
src/features/ → One module per feature
src/shared/   → Shared components and hooks
src/store/    → Zustand stores (one per domain)
supabase/     → SQL migrations and Edge Functions (Deno, not Node.js)

## Critical rules
- Zustand = ONLY client state
- TanStack Query = ONLY server state
- Supabase RLS required on ALL tables
- Auth tokens in expo-secure-store, NEVER AsyncStorage
- Activities use 18 configurable tracking element types → see @docs/feature-specs/activity-builder.md
- Multi-tenancy: user → family_members → family_id
- Offline-first: expo-sqlite as local truth
- Media: use expo-video and expo-audio — expo-av removed in SDK 55
- New builds ONLY for native code changes — JS changes update via dev server

## NEVER do
- NO any → use unknown
- NO TouchableOpacity → use Pressable
- NO inline styles → use StyleSheet.create
- NO server data in Zustand
- NO direct Supabase imports in components → go through services/

## Reference docs
@docs/architecture/02-project-structure.md
@docs/architecture/04-offline-sync.md
@docs/feature-specs/activity-builder.md
@docs/rewards-levels-accolades.md
@docs/compliance/privacy-and-data.md
@docs/plan.md
```

### 2.2 CLAUDE.local.md (personal, gitignored)

```markdown
# My working preferences

## Language
Always respond in English, regardless of the language I use to ask.

## Explanations
Explain things simply, without showing code.
I need to understand the problem, not read an implementation.

## Honesty
Be brutally honest. Never agree with me just to be agreeable.
If my approach is not the best option, say so directly.
If you are not sure about something, say so explicitly.

## Questions vs. Actions
When I ask a question, answer it (yes or no), then ask what I want to do.
Do NOT interpret a question as a request to implement.

## Before implementing
Always ask before implementing anything non-trivial.
Present your plan and rate it from 1 to 10 before executing.
Wait for my approval before proceeding.
```

### 2.3 .claude/settings.json hooks

- `PostToolUse` on Write/Edit `.ts` or `.tsx` → runs `bun run lint --fix --quiet`
- `Stop` → runs `bun run typecheck`

---

## 3. Code Conventions

- Componentes funcionales con TypeScript interfaces (no types)
- Hooks custom prefijados con `use*`
- Imports absolutos con `@/` alias
- Error boundaries en cada screen (using shared ErrorBoundary component)
- `NO any` → usar `unknown`
- `NO TouchableOpacity` → usar `Pressable`
- `NO inline styles` → usar `StyleSheet.create`
- `NO hardcoded hex colors` → usar tokens de `src/shared/theme.ts`

### Design system
- All colors, spacing, radii, and typography defined in `src/shared/theme.ts`
- Shared components: `Button` (primary/secondary/danger), `Card`, `ScreenWrapper`
- React Hook Form for complex forms (5+ fields, validation rules). Simple optional forms use useState.
- Celebration animations: pending final design — use react-native-reanimated (already installed)

### Timer pattern
```
// Store startTime as Date.now() in MMKV — never accumulate elapsed
const elapsed = Math.floor((Date.now() - startTime) / 1000)
```

### Activity Plugin interface
```typescript
export interface ActivityPlugin {
  id: string
  name: string
  category: ActivityCategory
  defaultConfig: Record<string, unknown>
  SessionScreen: React.ComponentType
  ConfigScreen: React.ComponentType
  SummaryCard: React.ComponentType
  validateSession: (data: unknown) => boolean
  evaluateRewards: (session: Session, rules: RewardRule[]) => Reward[]
}
```
