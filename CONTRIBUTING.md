# Contributing to AETHER (`CONTRIBUTING.md`)

AETHER prioritizes **engineering depth, context efficiency, and deterministic verification** over file count. Every contributed component must pass `npx tsx bin/aether.ts validate` before a pull request can be merged.

---

## Mandatory Component Contracts (Part 4 Specification)

### 1. Agent Specification Contract (`aether/agents/*.md`)
Every agent must define all 8 sections:
1. **Role**: Specific engineering discipline and authority level.
2. **Scope**: Boundaries of systems, languages, and lifecycle stages.
3. **Responsibilities**: Concrete engineering actions the agent owns.
4. **Restrictions**: Explicit actions the agent is forbidden from taking (e.g., adversarial agents cannot mutate production source files).
5. **Inputs**: Structured context slice, AST graph, or task artifacts required.
6. **Outputs**: Deterministic schema of patches, findings, or verification plans produced.
7. **Handoff Rules**: Preconditions and target agents for downstream escalation or completion.
8. **Verification Responsibilities**: Exact tests, typechecks, or invariants the agent must run before signaling completion.

### 2. Skill Specification Contract (`aether/skills/*.md`)
Every skill must define all 7 sections:
1. **When to Activate**: AST/file/intent trigger predicates (lazy loading).
2. **Required Information**: Minimum symbols, schemas, or logs needed.
3. **Execution Steps**: Deterministic step-by-step engineering procedure.
4. **Useful Tools**: Scoped CLI, AST, or MCP tools.
5. **Expected Outputs**: Concrete code, test, or diagnostic artifacts.
6. **Verification Criteria**: Command or assertion proving success.
7. **Failure Cases to Handle**: Known edge cases and rollback steps.

### 3. Workflow Specification Contract (`aether/workflows/*.md`)
Every workflow must define all 5 sections:
1. **Entry Conditions**: Repository state and required inputs.
2. **Execution Stages**: Ordered DAG stages with assigned agent capabilities.
3. **Dependencies**: Inter-stage data and lock dependencies.
4. **Failure Handling**: Rollback, retry budget, and escalation protocol.
5. **Completion Criteria**: Measurable exit gates (tests, security, blast-radius verification).

### 4. Open-Source License Attribution
If a skill, rule, or tool adapts concepts or patterns from another open-source repository (such as `affaan-m/ECC`, `Aider`, `Semgrep`, or `Tree-sitter`), you must:
- Verify the upstream license is permissive (`MIT`, `Apache-2.0`, `BSD-3-Clause`, `ISC`).
- Include the `license` and `attribution` fields in the component metadata and update `NOTICE.md`.
