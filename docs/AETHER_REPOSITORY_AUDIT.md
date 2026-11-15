# AETHER 1.0 — Repository Audit

**Created by Tabrej · License: Apache-2.0**
**Method:** each of the 16 reference repositories was shallow-cloned and inspected directly
(ownership via `git config remote.origin.url`, license via the repository's own LICENSE file,
architecture via top-level structure and source). Nothing in this audit is assumed from the
program brief — every URL and license below was verified against the cloned source.

## 1. Ownership & Canonical URL Verification

| # | Project | Verified canonical origin URL | Owner | Status |
| :---: | :--- | :--- | :--- | :--- |
| 1 | ECC | `https://github.com/affaan-m/ECC` | Affaan Mustafa | Active |
| 2 | Superpowers | `https://github.com/obra/superpowers` | Jesse Vincent (obra) | Active |
| 3 | REA | `https://github.com/morluto/rea` | morluto | Active |
| 4 | OpenHands | `https://github.com/All-Hands-AI/OpenHands` | All Hands AI | Active |
| 5 | OpenManus | `https://github.com/FoundationAgents/OpenManus` | Foundation Agents | Active |
| 6 | AutoGen | `https://github.com/microsoft/autogen` | Microsoft | **Archived** — successor: [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) |
| 7 | Browser Use | `https://github.com/browser-use/browser-use` | Browser Use (Gregor Zunic et al.) | Active |
| 8 | Agent Browser | `https://github.com/vercel-labs/agent-browser` | Vercel Labs | Active |
| 9 | Skyvern | `https://github.com/Skyvern-AI/skyvern` | Skyvern AI | Active |
| 10 | OmniParser | `https://github.com/microsoft/OmniParser` | Microsoft | Active |
| 11 | Lightpanda | `https://github.com/lightpanda-io/browser` | Lightpanda | Active |
| 12 | Playwright | `https://github.com/microsoft/playwright` | Microsoft | Active |
| 13 | Puter | `https://github.com/HeyPuter/puter` | Puter Inc. | Active |
| 14 | Obsidian Releases | `https://github.com/obsidianmd/obsidian-releases` | Obsidian | Active (registry only — **no app source**) |
| 15 | ComfyUI | `https://github.com/Comfy-Org/ComfyUI` | Comfy Org | Active |
| 16 | Three.js | `https://github.com/mrdoob/three.js` | mrdoob / three.js authors | Active |

All 16 canonical URLs confirmed against the clones' `origin` remotes.

## 2. License Audit (verified from each repo's LICENSE file)

| Project | Verified license | Copyleft? | AETHER treatment |
| :--- | :--- | :---: | :--- |
| ECC | MIT | No | Concepts reused; AETHER is Apache-2.0 (compatible) |
| Superpowers | MIT | No | TDD/workflow discipline extracted |
| REA | MIT | No | Analysis workflow + authorization posture adopted |
| OpenHands | MIT | No | Event-stream/resumption architecture reference |
| OpenManus | MIT | No | Plan-and-act architecture reference |
| AutoGen | CC-BY-4.0 (docs) / MIT (code, `LICENSE-CODE`) | No | **Archived** — pattern reference only, no dependency |
| Browser Use | MIT | No | Grounding + verification-loop concepts |
| Agent Browser | Apache-2.0 | No | Compact `[ref]` a11y snapshot model |
| Skyvern | **AGPL-3.0** | **Yes** | **Out-of-process HTTP only** — never linked/imported |
| OmniParser | CC-BY-4.0 (paper/dataset license; package terms separate) | No | Grounding concept reimplemented clean-room |
| Lightpanda | **AGPL-3.0-only** | **Yes** | **Out-of-process CDP only** — never linked/imported |
| Playwright | Apache-2.0 | No | Primary cross-browser provider model |
| Puter | **AGPL-3.0-only** | **Yes** | **Out-of-process** — workspace concept only, no import |
| Obsidian Releases | registry data (no app source) | No | Registry/vault concept; no proprietary code involved |
| ComfyUI | **GPL-3.0** | **Yes** | **Out-of-process** — node-graph concept only, never linked |
| Three.js | MIT | No | 3D scene-graph model in the AETHER frontend |

### License-critical decisions
- **No AGPL/GPL code was imported, vendored, or linked into the Apache-2.0 AETHER tree.**
  Skyvern (AGPL), Lightpanda (AGPL), Puter (AGPL), and ComfyUI (GPL) are integrated
  strictly as **out-of-process** backends speaking HTTP/CDP, exactly as AETHER's existing
  `ecosystemAdapters.ts` already enforces (`OUT_OF_PROCESS_HTTP_OR_CDP_ONLY` isolation).
- AutoGen is archived: it is used as an architectural research reference, and Microsoft
  Agent Framework is noted as its successor. **No runtime dependency on either was added.**
- Obsidian Releases was confirmed to contain **no proprietary application source** — only
  the public registry (plugin/theme lists, deprecation + stats, release channels). AETHER
  studies that registry model, consistent with the program brief.

## 3. Third-Party Dependency Audit (what a user would actually pull in)

| Integration path | Dependencies pulled into AETHER | Risk |
| :--- | :--- | :--- |
| In-process program engines (`src/core/programs/*`) | **None.** Pure TypeScript, no new `package.json` dependencies. | None |
| Browser execution (P05/P06/P07) when a live browser is used | Playwright (Apache-2.0) or Lightpanda (AGPL, out-of-process CDP) chosen **at deploy time** | Controlled via provider selection + security profile `NETWORK_EGRESS_CONTROLLED` |
| Creative backend (P09) when a real generation model is used | ComfyUI (GPL, out-of-process) | Isolated; AETHER core never links it |
| Reverse subsystem live slots (P02) | External analyzers (objdump/ghidra) only when the user opts in | `AUTHORIZED_TARGET_ONLY` security profile; slots are UNMEASURED otherwise |

The nine AETHER-native engines add **zero new runtime dependencies** to the Apache-2.0 core;
external engines enter only through the controlled lifecycle (`DISCOVER → INSTALL → VALIDATE →
REGISTER → EXECUTE → MONITOR → UPDATE → REMOVE`) and only through out-of-process boundaries
where a copyleft license applies.
