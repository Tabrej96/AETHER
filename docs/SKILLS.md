# AETHER 1.0 — The Skill Catalog (540 Skills)

Created by Tabrej · License: Apache-2.0

AETHER ships **540 validated engineering skills** (`FULL_AETHER_SKILLS` in
`src/data/repositoryCatalog.ts`, consumed by `src/core/skillEngine.ts`). A
skill is a self-contained, reviewable procedure — a method plus its
activation conditions — not a monolithic prompt.

---

## 1. Domains (by count)

| Domain | Count |
| :--- | ---: |
| Polyglot Engineering & Core Intelligence (eng, databases, security) | 332 |
| Design & UI Craft (design systems, typography, visual craft) | 105 |
| AWS, Cloud & VPS Infrastructure (cloud-native, bare-metal VPS) | 85 |
| Video & Media Engineering (FFmpeg, programmatic media) | 18 |

## 2. Skill shape

```ts
{
  id: 'oklch-perceptual-color-palette-architect-specification',
  name: 'OKLCH Perceptual Color Palette: Architect Specification',
  domain: 'Design & UI Craft · …',
  whenToActivate: '…',   // the condition under which this skill applies
  procedure: string[],   // ordered, reviewable steps
  // …verification + output contracts
}
```

The `whenToActivate` field is what makes the **lazy skill router** work:
`aether_skill_router` (MCP tool) matches a task prompt + active file path
against all 540 skills with a 28-token lazy index, returning the top-3 with a
per-call token cost far below stuffing every skill into context (measured in
`release-evidence/gate05-registry.txt`).

## 3. How skills are used

- **`aether install`** writes skills into your harness's skill conventions.
- **The Skill Engine** composes skills into the nine capability programs
  (`src/core/programs/`) — e.g. P01 Development Intelligence chains
  *research → plan → TDD → adversarial verification* from individual skills.
- **`aether_skill_router`** answers "which skills apply to *this* task?"
  without loading the whole catalog.

## 4. Validation, not vibes

Every skill passes the 5-rubric quality scorer (`aether_component_score_refine`):
completeness, safety-boundedness, verifiability, non-duplication, and
token-efficiency. The current mean score across all 711 components is
reported live by `aether benchmark` — it is measured, never assumed.
