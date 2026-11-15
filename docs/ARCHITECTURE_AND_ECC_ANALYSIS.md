# AETHER Phase 1–4 Blueprint: Complete ECC Analysis, Competitive Landscape & 100x Architecture

## 1. Deep Inspection of Everything Claude Code (`affaan-m/ECC`)

We inspected the architecture, component taxonomy, hook pipelines, memory mechanisms, and security tooling of **Everything Claude Code (`affaan-m/everything-claude-code` / `affaan-m/ECC`)**, created by Affaan Mustafa (MIT License).

### 1.1 How ECC Is Architected Today
- **Agents (`agents/*.md`)**: Static Markdown persona files (e.g., `planner.md`, `architect.md`, `code-reviewer.md`, `build-error-resolver.md`, `security-reviewer.md`, `tdd-guide.md`, `e2e-runner.md`) placed into `.claude/agents/`. They rely on prompt instructions rather than enforced input/output schemas or exclusive file-write leases.
- **Skills (`skills/*/SKILL.md`)**: Operational playbooks (e.g., `tdd-workflow`, `security-review`, `coding-standards`, `springboot-patterns`, `golang-patterns`, `continuous-learning-v2`). While comprehensive, loading multiple skills simultaneously injects thousands of lines of markdown into the active context window.
- **Hooks (`hooks/hooks.json`)**: Shell and Node scripts triggered on `PreToolUse`, `PostToolUse`, `Stop`, and `PreCompact` events in Claude Code (e.g., running `prettier`, blocking `console.log`, warning on large files, or saving session summaries). Multiple hooks frequently collide or add 1–3s of shell startup latency per tool call.
- **Rules (`rules/*.md`)**: Monolithic or language-split markdown checklists (`security.md`, `coding-style.md`, `testing.md`, `git-workflow.md`) copied into `~/.claude/rules/` or `.claude/rules/`.
- **Memory & Continuous Learning (`continuous-learning-v2`)**: Uses background hooks to observe tool usage and extract "instincts" with confidence scores (`0.3` to `0.9`) stored in local markdown/JSONL files. **Critical Weakness:** Instincts are promoted based on repetition frequency rather than verified compilation, test execution, or adversarial security review—allowing brittle workarounds to become permanent instructions.
- **Context Optimization**: Primarily relies on manual `/compact` commands, `PreCompact` summary hooks, and static CLI flags rather than AST call-graph slicing or token-utility optimization.
- **Security (`AgentShield`)**: Static regex/pattern scanner auditing `.claude/` configuration files, MCP servers, and tool permissions. Lacks runtime indirect prompt-injection sandboxing for untrusted repository files or live command AST analysis.
- **Testing & Benchmarking**: ECC validates its own markdown/JSON packaging scripts, but lacks a reproducible, multi-trial statistical harness measuring actual task pass rate, regression introduction rate, and token efficiency on real repositories against a baseline.

---

## 2. Competitive Landscape & Open-Source Ecosystem Audit

Rather than reinventing mature infrastructure, AETHER integrates proven open-source methodologies (with full license compliance in `NOTICE.md`) while solving their architectural blind spots:

| Project / Technology | License | Core Strength Integrated Patterns | Architectural Weakness Solved by AETHER |
| :--- | :--- | :--- | :--- |
| **Everything Claude Code (`affaan-m/ECC`)** | MIT | Modular `.claude/` packaging, `PreCompact` hooks, `AgentShield` config auditing, instinct concept. | High idle token overhead; unverified instinct drift; no AST blast-radius graph; no adversarial verification gate. |
| **Aider (`Aider-AI/aider`)** | Apache-2.0 | Tree-sitter RepoMap with graph ranking over symbol definitions and references. | RepoMap is static per turn; lacks git co-change weighting, test-impact mapping, and missing-context detection. |
| **Model Context Protocol (`modelcontextprotocol`)** | MIT | Standardized JSON-RPC tool/resource interface across Claude, Cursor, OpenCode, and IDEs. | MCP servers expose raw tools without capability sandboxing, token-budget truncation, or prompt-injection filtering. |
| **SWE-bench (`SWE-bench/SWE-bench`)** | MIT | Reproducible Dockerized evaluation using `FAIL_TO_PASS` and `PASS_TO_PASS` test patches. | Evaluates single-shot patch success only; does not measure token cost variance, security regressions, or recovery from context exhaustion. |
| **OpenHands (`All-Hands-AI/OpenHands`)** | MIT | Event-sourced agent execution log and sandboxed runtime abstractions. | Heavyweight container orchestration unsuitable for zero-latency local CLI drop-in inside existing IDE harnesses. |
| **Repomix (`yamadashy/repomix`)** | MIT | Repository packing and token counting with `.gitignore` awareness. | Full-repo packing overwhelms context windows; AETHER replaces full packing with sub-graph AST slicing. |

---

## 3. Competitive Capability Matrix (ECC vs. AETHER)

Every capability is classified strictly as **Equivalent**, **Improved**, **Fundamentally Redesigned**, or **New Capability**:

| Capability Domain | ECC Approach | AETHER Classification | AETHER Engineering Mechanism |
| :--- | :--- | :--- | :--- |
| **Context Assembly** | Static file reads + manual `/compact` | **Fundamentally Redesigned** | **Neural Context Intelligence**: Personalized PageRank on AST import/call graph + git co-change matrix + knapsack token budgeter + pollution eviction. |
| **Multi-Agent Coordination** | Independent persona prompts in `agents/` | **Fundamentally Redesigned** | **Dynamic Agent Swarm**: Capability-scored team sizing (often 1 agent for simple tasks), DAG task graph, exclusive file-write leases, and formal consensus arbitration. |
| **Change Impact Analysis** | None (relies on LLM guessing affected files) | **New Capability** | **Predictive Engineering Intelligence**: Pre-edit symbol blast-radius calculation, API contract diff check, schema migration risk score, and targeted verification test selection. |
| **Code & Security Verification** | Friendly `code-reviewer.md` checklist prompt | **Fundamentally Redesigned** | **Adversarial Engineering**: 6 hostile challenger personas that must produce concrete failure scenarios or reproducer tests to block a change. |
| **Engineering Memory** | Flat session summaries & `instincts` files | **Fundamentally Redesigned** | **Deep Engineering Memory**: 7-layer DAG store with SHA-256 provenance, confidence half-life decay, and explicit `VERIFIED` vs. `QUARANTINED` states. |
| **Debugging Methodology** | `build-error-resolver.md` prompt instructions | **Improved** | **Autonomous Debugging Protocol**: Enforced state machine requiring failing test reproduction before code modification and Bayesian hypothesis elimination. |
| **Model Routing** | Hardcoded Claude model tiers (`sonnet`/`opus`/`haiku`) | **Fundamentally Redesigned** | **Adaptive Model Intelligence**: Provider-independent Pareto router scoring Claude, Gemini, OpenAI, DeepSeek, and local models across cost, latency, context, and task benchmark score. |
| **Continuous Learning** | `continuous-learning-v2` frequency-based instincts | **Fundamentally Redesigned** | **Quarantine-Gated Knowledge Promotion**: Candidate patterns must pass deterministic tests across 3+ tasks and survive adversarial audit before promotion. |
| **Session Continuity** | `PreCompact` markdown summary hook | **Improved** | **Zero-Loss Continuity**: Content-addressed Merkle checkpoint ledger storing exact task DAG state, falsified hypotheses, file hashes, and verification evidence. |
| **Security & Trust Boundaries** | `AgentShield` static config scanner | **Improved** | **Runtime Security Intelligence**: Untrusted data spotlighting (indirect prompt-injection defense), Shannon entropy secret blocking, shell AST validation, and MCP scope enforcement. |
| **Selective Installation** | Copy folders or plugin install | **Improved** | **Zero-Overhead Selective Installer**: Dependency-resolved capability manifest compiling into `.claude`, `.cursor`, `AGENTS.md`, or `.opencode` with < 650 idle token budget. |
| **Empirical Benchmarking** | Packaging unit tests only | **New Capability** | **Multi-Trial Benchmark Suite**: Head-to-head statistical evaluator reporting mean, standard deviation, 95% CI, token efficiency, and regression rate. |

---

## 4. Challenging Our Own Design: Where AETHER Could Fail & Mitigations

Before writing code, we subjected AETHER's proposed architecture to adversarial self-critique:

### Failure Mode 1: "The Meta-Harness Token Tax"
- **Risk:** If AETHER's 10 intelligence systems inject lengthy protocols, swarm handoff headers, and memory schemas into the prompt, AETHER will consume *more* tokens than ECC and degrade coding performance.
- **Architectural Mitigation:** All heavy computation (AST graph ranking, blast-radius traversal, secret scanning, memory decay, model routing, checkpoint hashing) runs **deterministically out-of-band in fast TypeScript/Node scripts (< 35ms)** via MCP or CLI hooks. The LLM only receives the **distilled context slice (< 650 tokens of harness overhead)**.

### Failure Mode 2: "Swarm Over-Orchestration on Simple Tasks"
- **Risk:** Spawning a 5-agent swarm for a 15-line bugfix multiplies latency and token usage by 5x while introducing coordination errors.
- **Architectural Mitigation:** `swarmEngine.ts` computes a **Task Complexity & Coupling Index (TCCI)**. Tasks below threshold (`TCCI < 0.35`, single module, low blast radius) are strictly routed to a **Single Autonomous Engineer + 1 lightweight post-edit check**, bypassing multi-agent swarm overhead entirely.

### Failure Mode 3: "Adversarial Deadlock (Endless Critic Loops)"
- **Risk:** Adversarial challengers might nitpick stylistic preferences indefinitely, preventing task completion.
- **Architectural Mitigation:** Challengers are forbidden from blocking on subjective style (style is enforced deterministically by linters/formatters). An adversarial block is only valid if accompanied by a **concrete falsifiable claim** (`SECURITY_EXPLOIT`, `API_BREAKING_CHANGE`, `RACE_CONDITION`, `UNHANDLED_EDGE_CASE`) and a **reproducer specification**, capped at a maximum of 2 refinement rounds before escalating with structured evidence.

### Failure Mode 4: "Memory Poisoning & Stale Architectural Assumptions"
- **Risk:** Old architectural memories become invalid after a refactor, misleading future sessions.
- **Architectural Mitigation:** Every memory entry in `memoryEngine.ts` binds to **file-path SHA-256 content hashes**. When a referenced file changes, dependent memory nodes automatically transition from `VERIFIED` to `STALE_REVALIDATION_REQUIRED` and their retrieval confidence decays exponentially.
