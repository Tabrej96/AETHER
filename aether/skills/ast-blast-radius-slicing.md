---
id: ast-blast-radius-slicing
name: AST Symbol Graph & Blast-Radius Slicing
version: 2.0.0
domain: context-intelligence
license: Apache-2.0
attribution: "AETHER Core Skill — integrates concepts from Tree-sitter (MIT) and Aider RepoMap (Apache-2.0)"
tokenCost: 110
---

# Skill: AST Symbol Graph & Blast-Radius Slicing (`ast-blast-radius-slicing`)

## 1. When to Activate
Activate prior to any multi-file bugfix, signature change, schema alteration, or refactoring task where more than 2 files exist in the target module, or when context utilization exceeds 35% of the active token budget.

## 2. Required Information
- Target entry symbols, error stack trace locations, or user-referenced file paths.
- Repository import/export adjacency list and recent git commit co-change pairs.
- Active model token budget (`maxContextTokens`) and reserved output buffer.

## 3. Execution Steps
1. Extract seed symbols from the task prompt, failing test output, or stack trace frames.
2. Construct the directed symbol reference graph $G = (V, E)$ where edges carry weights $w_{\text{import}} = 1.0$, $w_{\text{call}} = 1.4$, $w_{\text{type}} = 0.8$, and $w_{\text{cochange}} = 0.6$.
3. Execute Personalized PageRank ($\alpha = 0.85$, 20 iterations) seeded on the task symbols to rank every repository file by structural relevance.
4. Prune polluted or low-utility files (lockfiles, build artifacts, vendored bundles, unrelated modules with score $< 0.05$).
5. Apply 0/1 Knapsack token allocation: include full bodies for top-ranked seed files, AST interface signatures (`SKELETON_ONLY`) for 1-hop callers/callees, and omit 2+ hop transitive nodes unless they are direct integration tests.

## 4. Useful Tools
- `aether-context-slice` (`src/core/contextEngine.ts`)
- `aether-blast-radius` (`src/core/predictiveEngine.ts`)
- `git log --name-only -n 50`

## 5. Expected Outputs
- Ranked context manifest with per-file compression tier (`FULL_SOURCE`, `SIGNATURE_SKELETON`, `EVICTED`).
- Missing-context warnings for unresolved external imports or environment contracts.
- Token savings report comparing full-file ingestion vs. neural context slice.

## 6. Verification Criteria
- Context slice total token count must be $\le$ allocated budget (`budgetTokens`).
- 100% of direct symbol definitions mutated by the task must be present in `FULL_SOURCE` tier.
- Zero generated/vendor files (`dist/`, `node_modules/`, `*.min.js`) present in the slice.

## 7. Failure Cases to Handle
- **Dynamic Reflection / String-Based Imports**: When static AST imports cannot resolve dynamic route loaders, fall back to git co-change coupling edges and emit an explicit `DYNAMIC_BOUNDARY_WARNING`.
- **Circular Dependency Clusters**: Cap graph traversal depth at 4 hops and normalize rank scores by out-degree to prevent utility barrel files (`index.ts`) from monopolizing the token budget.
