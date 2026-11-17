# AETHER 1.0 — The Agent Catalog (117 Agents)

Created by Tabrej · License: Apache-2.0

AETHER ships **117 specialized engineering agents** as fixed, versioned data
(`src/data/repositoryCatalog.ts` → `FULL_AETHER_AGENTS`, imported into
`src/core/agentEngine.ts`). Each agent is a structured spec — not a prompt
blob — with explicit responsibilities, restrictions, inputs/outputs, handoff
rules, and verification duties, so a downstream harness can schedule them
deterministically.

---

## 1. Categories (by count)

| Category | Count | What they do |
| :--- | ---: | :--- |
| `implementation` | 66 | Build features end-to-end: language, database, cloud, video, UI |
| `architecture` | 13 | Design systems, blast-radius analysis, ADR authorship |
| `security` | 11 | Threat modeling, injection/SSRF/credential audit, remediation |
| `verification` | 9 | Adversarial review, test design, evidence-gathering gates |
| `debugging` | 7 | Reproduction-first diagnosis, binary-search isolation |
| `adversarial` | 7 | Fuzz, red-team, mutation-based quality gates |
| `memory` | 4 | Persistence, continuity checkpoints, learning capture |

## 2. Agent spec fields

Every agent carries the same shape (excerpt):

```ts
{
  id: 'arch-systems-prime',
  name: 'Principal Systems & Blast-Radius Architect',
  category: 'architecture',
  role: '…',
  scope: '…',
  responsibilities: string[],
  restrictions: string[],       // hard guardrails; the harness enforces, doesn't advise
  inputs: string[],
  outputs: string[],
  handoffRules: string[],       // who this agent hands off to, and with what artifacts
  verificationResponsibilities: string[],
  capabilities: string[],
}
```

The `restrictions` field is load-bearing: the Security Engine and Validation
Engine treat it as policy, not suggestion (see
[AETHER_SECURITY_THREAT_MODEL.md](./AETHER_SECURITY_THREAT_MODEL.md)).

## 3. How agents are used

- **`aether build "<prompt>" --out <dir>`** materializes a professional full-stack
  product from ANY prompt (any industry/app type): `frontend/` + `backend/`
  + `deploy/` structure, Express/SQLite API with JWT auth, server-side business
  logic (commerce + payment provider layer for order domains), provider-ready
  deploy configs (Render / AWS / DigitalOcean / Vercel / Netlify / Cloudflare),
  its own CI workflow, and a verification report — pass `--verify` to also run
  the generated HTTP test suite + frontend production build. Engine:
  `src/core/scaffolding/productScaffolder.ts` + `verifyScaffold.ts` (§13: the
  generator never declares done on its own authority).
- **`aether install --target <harness>`** writes the agents into your harness's
  agent conventions (`.claude/agents/`, `AGENTS.md`, `.cursor/`, …).
- **The Swarm Engine** schedules agents over a task DAG with exclusive file
  leases — two agents never hold a write lock on the same file.
- **The 8-tool MCP server** routes capability requests (`aether_swarm_scheduler`)
  to the right agents at runtime.

To inspect any agent programmatically:

```ts
import { AETHER_AGENTS } from './src/data/repositoryCatalog';
const a = AETHER_AGENTS.find((x) => x.id === 'arch-systems-prime');
```
