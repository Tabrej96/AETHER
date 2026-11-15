# AETHER 1.0 — Nine Advanced Capability Research Programs

**Created by Tabrej · License: Apache-2.0**
**Method:** each program followed the 12-step process — download & inspect → verify ownership & canonical URL → inspect architecture → identify reusable algorithms → analyze weaknesses → audit licenses & dependencies → compare with existing AETHER → remove duplication → design improved implementation → implement → benchmark → document.

All nine programs produced AETHER-native engines under `src/core/programs/`, integrated through the stable contracts in `src/core/programs/types.ts` and the lifecycle-managed registry in `src/core/programs/registry.ts`. The result: **9 new program engines, 1 shared contract module, 1 registry manager, and 10 integration tests** — with zero duplication of existing engines (context, swarm, memory, MCP, hook, model router, continuity, security, validation all reused as-is).

---

## PROGRAM 01 — DEVELOPMENT INTELLIGENCE
**Repositories:** [affaan-m/ECC](https://github.com/affaan-m/ECC) (MIT) · [obra/superpowers](https://github.com/obra/superpowers) (MIT)
**Engine:** `src/core/programs/p01DevelopmentIntelligence.ts`

### What was inspected
- **ECC** (`ecc-universal`, Affaan Mustafa) is a harness-native "agent operating system": a large catalog of markdown skills, hook JSON files, `AGENTS.md`/`CLAUDE.md` conventions, and context-optimization docs. Strongest ideas: **skill discovery via activation triggers**, **pre/post-tool hooks with conflict deduplication**, and **lazy context loading**. Weakness: skill bodies are static markdown — activation is keyword-adjacent, not AST/intent-deterministic, and there is no gate preventing an agent from planning before research.
- **Superpowers** (Jesse Vincent) is a skill + runtime bootstrap for coding agents whose defining strength is the **brainstorm → plan → TDD → implement discipline** and hook-driven verification. Weakness: the TDD discipline is prose — no machine-checkable Red/Green/Refactor state.

### What AETHER improved
`p01DevelopmentIntelligence.ts` composes both onto AETHER's existing Skill/Workflow/Hook/Memory/Debug engines (no new skill system):
1. **Deterministic skill discovery** — ranks AETHER skills by overlap of AST/intent trigger signals with observed task signals (replaces keyword proximity).
2. **Research-first gate** — planning is blocked until a research dossier exists (ECC lacked this; Superpowers had it in prose).
3. **Red-Green-Refactor TDD state machine** — a machine-checkable gate: no RED test ⇒ BLOCKED; still RED ⇒ GREEN not entered.
4. **Debugging hypothesis ledger** — confirmed hypotheses with evidence feed the existing Memory Engine promotion gate.
5. **Instinct extraction** — each discovered skill becomes a quarantined pattern candidate (the existing `evaluatePatternPromotion` decides promotion; AETHER never auto-promotes).

**Measured:** happy path discovers 3 ranked skills and clears every gate; a research-missing task is blocked with 2 explicit reasons.

## PROGRAM 02 — REVERSE ENGINEERING
**Repository:** [morluto/rea](https://github.com/morluto/rea) (MIT)
**Engine:** `src/core/programs/p02ReverseIntelligence.ts`

### What was inspected
- **REA** (`rea-agents`) is a terminal + MCP CLI that reverse-engineers software; it ships a `DISCLAIMER.md` acknowledging legal boundaries and an `AUTHORIZED` usage posture. Strongest idea: **read-only application analysis + automated technical reporting** via a controlled agent pipeline. Weakness: analysis depth depends on the host toolchain; no hard machine-enforced authorization gate in the data model.

### What AETHER improved
An **isolated, permission-controlled** subsystem:
- `assertAuthorization()` is a **hard pre-condition** — no analysis runs without a recorded basis (`OWNED`, `AUTHORIZED_LICENSE`, `CTF_TARGET`, `DEFENSIVE_SECURITY`) and evidence. Unauthorized targets throw before any data is touched.
- Architecture extraction from an observed file graph: module graph, external dependency discovery, deterministic layer inference (interface / domain / utility / test / entry), entry-point candidates, and an automated reconstruction summary.
- **Honest capability slots:** binary discovery, network capture, and UI-behavior discovery are declared `UNMEASURED` without external tooling — never fabricated.

**Measured:** a 4-module synthetic service reconstructs to 4 layers, 2 external dependencies (`express`, `pg`), with all live-target slots declared unmeasured.

## PROGRAM 03 — AUTONOMOUS EXECUTION
**Repositories:** [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) (MIT) · [FoundationAgents/OpenManus](https://github.com/FoundationAgents/OpenManus) (MIT)
**Engine:** `src/core/programs/p03AutonomousExecution.ts`

### What was inspected (architecture comparison, not duplication)
- **OpenHands** (CodeAct): an event-stream coding agent in Docker sandboxes; resumption is session-based (checkpoint the event stream, replay). Strongest idea: **event-stream + resumption** for long-running tasks. Weakness: resumption is coarse-grained at session level; step-level crash recovery and step-level verification are not first-class.
- **OpenManus**: a general-purpose plan-and-act agent (Python, `workspace` + `sandbox_main`). Strongest idea: **planning → acting loop with tool registry**. Weakness: verification of intermediate steps is prompt-driven, not deterministic.

AETHER did **not** import either runtime. It added what both lack:
- `executeResumableTask()`: goal → dependency-ordered plan → per-step **deterministic verify predicates** → checkpoint (`completedStepIds` + accumulated state) → **resume replays only failed steps** (completed steps are trusted, failed steps are retried) → autonomous final-state verification.
- A failed step deterministically **skips its transitive dependents** (`SKIPPED_DEP_FAILED`), so a crash never silently produces wrong dependents.

**Measured:** run 1 completes 2/4 steps and checkpoints resumable; resume from that checkpoint completes 4/4 and self-verifies. Exactly the 2 remaining steps finished after resume.

## PROGRAM 04 — MULTI-AGENT ORCHESTRATION
**Repository:** [microsoft/autogen](https://github.com/microsoft/autogen) (MIT code / CC-BY-4.0 docs, **archived**)
**Engine:** `src/core/programs/p04MultiAgentOrchestration.ts`

### What was inspected
- AutoGen's architecture: **event-driven agents**, message-passing group chats, agent teams, parallel execution. The README confirms the project is **archived** and points to [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) as the successor. Per the program brief, AutoGen is used strictly as an architectural reference; **no AutoGen dependency** was introduced and Agent Framework was not adopted (it is a .NET/Python runtime whose concepts — event bus, group chat, agent teams — were extracted as patterns).
- Key pattern reused: the **append-only event log** as the coordination substrate, plus **group-conversation turns** between parallel waves.

### What AETHER improved
`orchestrateAgentTeam()` — a deterministic event-bus orchestrator:
- Task dependency graph → topological **parallel waves** (independent tasks share a wave).
- **Append-only message log** (`TASK_ASSIGN`, `TASK_RESULT`, `BLOCKING_QUESTION`, `GATE_VERDICT`).
- **Retry-once, fail-fast** policy on failure; a missing agent capability is recorded as a blocking question and the scheduler terminates deterministically (never spins — the infinite-schedule bug this design prevents was caught in testing).
- Group-conversation turns fire between waves when ≥2 agents must reconcile outputs.

**Measured:** 3-task DAG executes in 2 parallel waves with 1 deterministic retry and 1 group-conversation turn; a task requiring a missing capability fails fast with named evidence.

## PROGRAM 05 — BROWSER INTELLIGENCE
**Repositories:** [browser-use/browser-use](https://github.com/browser-use/browser-use) (MIT) · [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) (Apache-2.0)
**Engine:** `src/core/programs/p05BrowserIntelligence.ts`

### What was inspected
- **Browser Use**: DOM + bounding-box + vision LLM loop; strongest ideas: **element grounding by bounding box** and **task verification after each action**. Weakness: vision-LLM token cost per step; nondeterministic grounding.
- **Agent Browser** (Vercel Labs): a native Rust CLI that renders a page as a **compact accessibility tree with `@eN` refs** — the agent acts on a ref and re-reads the page. Strongest idea: **low-token a11y snapshots as the primary interaction surface**, with coordinate/vision only as fallback.

### What AETHER improved
**One unified Browser Engine with ranked interaction strategies** (the program brief's requirement):
1. `DETERMINISTIC_DOM` / `A11Y_REF` (rank 0, low-token, reproducible) →
2. `FORM_FILL` / `SCREENSHOT_VERIFY` (rank 1) →
3. `VISION_COORDINATE` (rank 2, fallback only; reported `UNMEASURED` without a live backend — never a fabricated hit).
- `buildA11ySnapshot()` quantifies the agent-browser token win: a compact `[ref]` snapshot vs a naive full-DOM dump.
- Live execution delegates to the P07 provider abstraction (Playwright/Lightpanda selection), keeping AETHER's engine backend-agnostic.

**Measured:** on the P07 sample checkout form, deterministic locators resolve a labeled input with confidence ≥0.9; an unresolvable vision query returns `element: null` with an escalation note; snapshot tokens are strictly cheaper than raw-DOM tokens.

## PROGRAM 06 — VISUAL COMPUTER INTELLIGENCE
**Repositories:** [Skyvern-AI/skyvern](https://github.com/Skyvern-AI/skyvern) (**AGPL-3.0**, out-of-process) · [microsoft/OmniParser](https://github.com/microsoft/OmniParser) (CC-BY-4.0)
**Engine:** `src/core/programs/p06VisualComputerIntelligence.ts`

### What was inspected
- **Skyvern**: vision-LLM website automation server. Architecture is a task → workflow planner → computer-use loop. Because it is **AGPL-3.0**, AETHER studies it out-of-process only; **no Skyvern code is imported or linked**.
- **OmniParser**: GUI element detection producing **element boxes + icons** for multimodal grounding; its license is CC-BY-4.0 (dataset/paper license — the Python package uses its own terms), so AETHER reimplements the *grounding concept* clean-room.

### What AETHER improved
The **perception → reasoning → action → verification** loop (the brief's core requirement):
- **Perception:** `DetectedElement[]` grounding set with normalized bboxes + confidence.
- **Reasoning:** deterministic `groundAction()` ranking (role match × confidence × label match).
- **Action:** click/coordinate (or `abort` — below a confidence floor the loop **escalates to a real vision backend rather than guessing**).
- **Verification:** the step only counts if the observed post-action state hash matches the expected one; stalls are detected and bounded.

**Measured:** a verified goal reaches a verified, state-changing action in 1 step; an ungrounded intent aborts in 1 step with an explicit UNMEASURED escalation note.

## PROGRAM 07 — BROWSER INFRASTRUCTURE
**Repositories:** [lightpanda-io/browser](https://github.com/lightpanda-io/browser) (**AGPL-3.0-only**, Zig) · [microsoft/playwright](https://github.com/microsoft/playwright) (Apache-2.0)
**Engine:** `src/core/programs/p07BrowserRuntime.ts`

### What was inspected
- **Lightpanda**: a from-scratch Zig headless browser speaking a **CDP subset**; fast page parsing at very low resource cost. Verified license is **AGPL-3.0-only** (its `LICENSING.md` states AGPL is the default). It is **not** a drop-in Chromium: WebGL, file chooser, PDF viewer and parts of the DOM API surface are not on par, so it is treated strictly as an **out-of-process CDP provider**.
- **Playwright**: the cross-browser (Chromium/Firefox/WebKit) provider with a full capability surface — accessibility tree, network intercept, forms/uploads, screenshots, downloads, isolated contexts.

### What AETHER improved
A **provider abstraction** with honest compatibility verification:
- `selectBrowserProvider()` ranks providers per task; a provider is `compatible` **only if it genuinely covers every required capability**. Gaps are returned as `missingCapabilities` with `verificationRequired: true` — the engine *reports* the gap instead of assuming a drop-in (the brief's explicit instruction).
- A WebGL scene-capture task profile demonstrates the contract: no provider covers `webgl scene capture`, so the selection is flagged for real-browser verification.

**Measured:** 4 task profiles verified — 3 fully-compatible picks, 1 correctly flagged unverified.

## PROGRAM 08 — WORKSPACE AND KNOWLEDGE ECOSYSTEM
**Repositories:** [HeyPuter/puter](https://github.com/HeyPuter/puter) (**AGPL-3.0-only**) · [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) (public registry, no app source)
**Engine:** `src/core/programs/p08WorkspaceKnowledge.ts`

### What was inspected
- **Puter** ("puter.com", AGPL-3.0-only): a browser-based desktop environment with an in-browser workspace and an extension ecosystem. AGPL ⇒ out-of-process study only; AETHER extracts the *workspace model* concept, not the code.
- **Obsidian Releases**: confirmed per the brief to contain **no proprietary app source** — it is the public plugin/theme registry (`community-plugins.json`, deprecation + stats files, release channels). AETHER studies this registry model: user-generated plugins, a SemVer'd extension surface, and **Markdown vault + wiki-link knowledge graphs**.

### What AETHER improved
- **Knowledge vault → graph:** `buildKnowledgeGraph()` from wiki-links + tag clusters, with degree, **orphans** (zero-link notes), and tag clusters — a deterministic reconstruction of Obsidian's graph view.
- **Workspace organization:** `planWorkspace()` places notes into project folders by tag mapping.
- **Extension discovery:** `discoverPlugins()` over a registry with permission + SPDX license audit per plugin (reusing the existing ecosystem-registry pattern), so AGPL plugins found in a registry are flagged for out-of-process treatment.

**Measured:** a 4-note vault yields a deduplicated edge set with the isolated note flagged as orphan; 4 files planned into 3 folders; plugin discovery audits each discovered plugin's permissions.

## PROGRAM 09 — CREATIVE AND VISUAL INTELLIGENCE
**Repositories:** [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) (**GPL-3.0**, out-of-process) · [mrdoob/three.js](https://github.com/mrdoob/three.js) (MIT)
**Engine:** `src/core/programs/p09CreativeVisualIntelligence.ts`

### What was inspected
- **ComfyUI**: a **node-based** AI workflow engine (load → sample → transform → export graph over model runtimes). GPL-3.0 ⇒ AETHER builds a **clean-room node-graph data model + topological scheduler**; ComfyUI itself plugs in as an out-of-process backend by node type, never as linked code.
- **Three.js**: MIT scene-graph + WebGL renderer. AETHER models the **3D rendering frontend separately** (scene objects, transforms, deterministic BFS render order, draw-call estimate) so creative work can target either a real Three.js scene or the in-process model.

### What AETHER improved (brief requirement: modular backend + separate 3D frontend)
1. **Modular generation backend:** `scheduleNodeGraph()` — backend-agnostic topological layers with cycle rejection; `resolveBackend()` maps node types to available backends and returns `null` (not a guess) for unknowns.
2. **Separate 3D frontend model:** `buildSceneGraph()` — object hierarchy, deterministic render order, draw-call estimate.

**Measured:** a 4-node generation graph schedules into 4 topological layers; a cyclic graph throws; a 3-object scene renders in deterministic order with a 2-draw-call estimate.
