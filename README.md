<div align="center">

# AETHER

### The open-source AI engineering harness that **executes**, not just explains

**117 agents · 540 skills · 54 workflows · 20 MCP tools · 21 capability engines — all Apache-2.0, all tested, all measured.**

[![Created by Tabrej](https://img.shields.io/badge/created%20by-Tabrej-orange)](https://github.com/Tabrej96)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org)

<a href="https://github.com/Tabrej96/AETHER" title="Open the GitHub repository">
  <img src="website/assets/github-mark.svg" alt="GitHub" width="20" height="20" style="vertical-align:-3px"/>
  <strong>github.com/Tabrej96/AETHER</strong>
</a>

</div>

---

## What is AETHER?

AETHER is a free, open-source toolkit that gives AI coding agents **real engineering superpowers**:
it plans tasks, splits them between agent teams, runs real code, checks the results, and remembers
long jobs if the machine crashes. Instead of *describing* a fix, it *does* the work and *proves* it.

### What AETHER can do

| Capability | What it means for you |
| :--- | :--- |
| **Execute real tasks** | Autonomous runtime runs real file + shell work in an isolated sandbox, verifies with SHA-256 Merkle checkpoints, and **resumes a crashed job from the exact step it stopped at** |
| **Multi-agent teams** | Agent teams run in parallel "waves" with exclusive file locks — real parallel work, not a simulation |
| **Safety you can audit** | 119+ automated tests across 14 suites, every critical module covered, and a 12-stage release certification that blocks the build when anything regresses |
| **Quality-gated catalog** | Every agent and skill is scored by a deterministic quality gate that checks for an executable verifier, zero-regression assertions, secret handling, and crash-recovery depth |
| **21 capability engines** | Domain intelligence, browser automation, visual computer use, reverse engineering, workspace management, creative generation, and more — all integrated through stable contracts |
| **Extensible** | 117 agents, 540 skills, 54 workflows, and 20 MCP tools you can compose, extend, or replace |

---

## Get started in 60 seconds

```bash
git clone https://github.com/Tabrej96/AETHER.git && cd AETHER

# No npm install needed for the core engines
# 1. See it work (no API keys needed for deterministic engines)
npx tsx bin/aether.ts programs

# 2. Validate every component
npx tsx bin/aether.ts validate

# 3. Install AETHER into your editor (all, or just a domain pack)
./install.sh --all --target all-harnesses --write .
```

> **Optional:** the interactive React workbench needs packages:
> `npm install --legacy-peer-deps && npm run dev` (not required for any engine or test).

### Live mode (optional)

Set an `AETHER_LIVE_PROVIDER_*` key in `.env` and run:

```bash
npx tsx bin/aether.ts runtime --live
```

AETHER verifies the model's plan against invariants and security gates **before** applying it — if the model's patch fails a check, AETHER says so and falls back to the verified patch. It never fakes a success.

---

## Documentation

| Resource | What you'll find |
| :--- | :--- |
| [`website/index.html`](website/index.html) | Full documentation site — capabilities and installation |
| [`docs/INSTALLATION.md`](docs/INSTALLATION.md) | Detailed installation guide |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Agent catalog and composition |
| [`docs/SKILLS.md`](docs/SKILLS.md) | Skill system and discovery |
| [`docs/MCP.md`](docs/MCP.md) | Model Context Protocol integration |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Component contracts and contribution guidelines |

---

## Inspiration credits

AETHER was built by studying the strongest ideas in the open-source ecosystem and re-implementing
them as original Apache-2.0 code under a rigorous research process. No copyleft (AGPL/GPL)
source was linked into AETHER's core — projects under those licenses were studied strictly
out-of-process.

| Project | License | Inspired AETHER program(s) |
| :--- | :--- | :--- |
| [Everything Claude Code](https://github.com/affaan-m/ECC) (ECC) | MIT | P01 Development Intelligence |
| [Superpowers](https://github.com/obra/superpowers) | MIT | P01 Development Intelligence |
| [REA](https://github.com/morluto/rea) | MIT | P02 Reverse Intelligence |
| [OpenHands](https://github.com/All-Hands-AI/OpenHands) | MIT | P03 Autonomous Execution |
| [OpenManus](https://github.com/FoundationAgents/OpenManus) | MIT | P03 Autonomous Execution |
| [AutoGen](https://github.com/microsoft/autogen) (archived) | MIT code | P04 Multi-Agent Orchestration |
| [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) | MIT | P04 Multi-Agent Orchestration |
| [Browser Use](https://github.com/browser-use/browser-use) | MIT | P05 Browser Intelligence |
| [Agent Browser](https://github.com/vercel-labs/agent-browser) | Apache-2.0 | P05 Browser Intelligence |
| [Skyvern](https://github.com/Skyvern-AI/skyvern) | AGPL-3.0 | P06 Visual Computer |
| [OmniParser](https://github.com/microsoft/OmniParser) | CC-BY-4.0 | P06 Visual Computer |
| [Lightpanda](https://github.com/lightpanda-io/browser) | AGPL-3.0 | P07 Browser Runtime |
| [Playwright](https://github.com/microsoft/playwright) | Apache-2.0 | P07 Browser Runtime |
| [Puter](https://github.com/HeyPuter/puter) | AGPL-3.0 | P08 Workspace & Knowledge |
| [Obsidian Releases](https://github.com/obsidianmd/obsidian-releases) | public registry | P08 Workspace & Knowledge |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | GPL-3.0 | P09 Creative & Visual |
| [Three.js](https://github.com/mrdoob/three.js) | MIT | P09 Creative & Visual |

Additional standards and libraries integrated across all programs: [Model Context Protocol](https://github.com/modelcontextprotocol/specification) (MIT), [Tree-sitter](https://github.com/tree-sitter/tree-sitter) (MIT), [FFmpeg](https://git.ffmpeg.org/ffmpeg.git) (LGPL-2.1 / MIT), [whisper.cpp](https://github.com/ggerganov/whisper.cpp) (MIT), [OKLab / APCA](https://bottosson.github.io/posts/oklab/) (MIT / W3C), [D3.js](https://github.com/d3/d3) (ISC), [OpenTofu](https://github.com/opentofu/opentofu) (MPL-2.0), [Kubernetes](https://github.com/kubernetes/kubernetes) (Apache-2.0), [PostgreSQL](https://github.com/postgres/postgres), [pgvector](https://github.com/pgvector/pgvector) (MIT), [WireGuard](https://www.wireguard.com/) (MIT), [Caddy](https://github.com/caddyserver/caddy) (Apache-2.0).

Full attribution details: [`NOTICE.md`](NOTICE.md)

---

**AETHER is created and maintained by [Tabrej](https://github.com/Tabrej96).**
