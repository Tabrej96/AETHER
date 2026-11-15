# AETHER 1.0 — Troubleshooting

Created by Tabrej · License: Apache-2.0

Every AETHER failure state is **designed, labeled, and reported** — the system
never fails silently, and it never fabricates a result. This page maps each
state you might see to its cause and fix.

---

## 1. Install & packaging

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `npm install` fails on peer-dep conflict | First install needs the legacy flag (a conflict in the upstream ESR tooling tree) | `npm install --legacy-peer-deps` (one-time; later installs are clean) |
| `npm pack` ships a 150+ KB tarball you don't understand | That's expected: it carries the pre-built `dist/bins/*.mjs` + sources | Nothing to do — heavy dev dirs (`website/`, `docs/`, `src/core`, `release-evidence/`) are correctly excluded |
| Installed `aether` bin does nothing | Node < 18 | Install Node ≥ 18 (LTS). AETHER reports its `engines` floor. |
| `install.sh` syntax errors | You're on Windows without bash/WSL | Use `npx tsx bin/aether.ts install …` (the shell script is POSIX only; the CLI works everywhere) |

## 2. Live provider (`GATE-01` state — see [PROVIDERS.md](./PROVIDERS.md))

| State | Meaning | What to do |
| :--- | :--- | :--- |
| `UNAVAILABLE_NO_CREDENTIALS` | `.env` missing/incomplete | Copy `.env.example` → `.env`, fill URL/KEY/MODEL. Expected on a clean clone — not an error. |
| `UNAVAILABLE_AUTH` | Key rejected | Verify the key for that vendor + URL; check `authStyle` (Anthropic uses `x-api-key`, OpenAI-compatible uses `bearer`). |
| `UNAVAILABLE_NETWORK` | Endpoint unreachable | Check host/port/TLS; note AETHER works fully **offline** otherwise — this state only matters for the live check. |
| `UNAVAILABLE_ERROR_SENTINEL` | HTTP 200 with an error body (common with invalid keys on gateways) | Fix the credentials; AETHER intentionally does NOT treat this as a live execution. |

## 3. Benchmarks & evidence

| Symptom | Meaning |
| :--- | :--- |
| A harness row says `UNAVAILABLE` with a command next to it | That harness needs a host daemon (OpenHands, Browser Use, …) not installed here. Run the listed external command, then re-run `npx tsx scripts/certify-benchmarks.ts` to promote it to `MEASURED`. |
| `MEASURED` cell shows estimated tokens | Token counts are the engine's char-based **estimates** unless the live provider reported real usage — see the classification table in `docs/AETHER_BENCHMARK_CERTIFICATION.md`. |
| A coverage number looks lower than expected | c8 over tsx drops some V8 branch-edge counts; figures are labeled "combined statement+function+v8-branch", never claimed as pure branch coverage. |

## 4. Multi-agent / runtime

| Symptom | Meaning |
| :--- | :--- |
| Task stays `QUEUED` after a crash | Expected — `PersistentTaskQueue.recover()` demotes in-flight `RUNNING` tasks on restart (a dead process never finished them). Re-run and they drain. |
| Two agents appear idle | Exclusive file leases: an agent never runs on a file another agent holds. This is a **feature**, serialized by the Swarm Engine. |
| `FAILED` with `lastError` in the queue log | The task hit `maxAttempts` (3). Read `lastError`; fix the root cause; re-enqueue. |

## 5. MCP

| Symptom | Meaning |
| :--- | :--- |
| Tool returns `BLOCKED_BY_SECURITY_GATE` | A built-in gate denied the specific call (e.g. the security spot-checker flagged injection). This is the safe path, not a bug — review the result payload for the reason. |
| No tools appear in your client | Register the server per [MCP.md](./MCP.md#2-register-it-with-your-harness) and restart the client; logs are on **stderr** by design, so a clogged stdout means the protocol stream was written to instead of logged. |

## 6. "Is my build broken?" quick check

```bash
npx tsx bin/aether.ts programs        # registry + provenance audit -> "OK"
npx tsx bin/aether.ts validate        # all 711 components validated
```

Both are deterministic and offline. If either exits non-zero, the failure
message names the exact component or gate.
