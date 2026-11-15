AETHER v1.0 — Sovereign Open-Source AI Engineering Harness
Nine Advanced Capability Research Programs (1.0 First Release)
Copyright 2026 Tabrej & AETHER Open-Source Contributors

Licensed under the Apache License, Version 2.0 (the "License").

================================================================================
UPSTREAM OPEN-SOURCE CREDITS, STANDARDS & COMMUNITY INSPIRATION ATTRIBUTION
================================================================================

Every component (117 Agents, 540 Skills, 54 Workflows, 6 Scoped Rules, and 20 MCP
Server Tools) in AETHER v1.0 carries explicit attribution to the open-source
projects, standards, and creators whose work it integrates with or builds upon:

1. Model Context Protocol (MCP) — Anthropic & MCP Specification Community (MIT)
   https://github.com/modelcontextprotocol/specification

2. Tree-sitter — Max Brunsfeld & Contributors (MIT)
   https://github.com/tree-sitter/tree-sitter

3. FFmpeg, libavfilter & libebur128 — Fabrice Bellard, FFmpeg Team & Jan Kokemüller (LGPL-2.1 / MIT)
   https://git.ffmpeg.org/ffmpeg.git

4. Remotion & whisper.cpp — Jonny Burger & Georgi Gerganov (MIT)
   https://github.com/remotion-dev/remotion
   https://github.com/ggerganov/whisper.cpp

5. OKLab / OKLCH & APCA Contrast — Björn Ottosson, W3C CSS WG & Andrew Somers / Myndex (MIT / W3C)
   https://bottosson.github.io/posts/oklab/

6. Three.js, D3.js & Motion — Ricardo Cabello (mrdoob), Mike Bostock & Matt Perry (MIT / ISC)
   https://github.com/mrdoob/three.js
   https://github.com/d3/d3

7. OpenTofu, AWS CDK & CNCF Kubernetes/Cilium — Linux Foundation, AWS & CNCF (MPL-2.0 / Apache-2.0)
   https://github.com/opentofu/opentofu

8. WireGuard, Caddy Server & Netfilter — Jason A. Donenfeld, Matthew Holt & Linux Kernel Community (MIT / Apache-2.0)
   https://www.wireguard.com/
   https://github.com/caddyserver/caddy

9. PostgreSQL, Zalando Patroni & pgvector — PostgreSQL Global Dev Group, Zalando & Andrew Kane (PostgreSQL / MIT)
   https://github.com/pgvector/pgvector

10. Everything Claude Code — Affaan Mustafa & Contributors (MIT)
    https://github.com/affaan-m/everything-claude-code
    Credited as an early open-source coding harness community inspiration.

================================================================
NINE CAPABILITY RESEARCH PROGRAMS — DIRECT INSPIRATION CREDITS
================================================================
The nine AETHER-native research-program engines (src/core/programs/*) were built by
researching the strongest engineering approaches of the following projects. Concepts
were re-implemented as original Apache-2.0 AETHER code; no copyleft (AGPL/GPL) source
was linked or vendored into the AETHER process. All nine engines and this notice were
created by Tabrej.

11. Everything Claude Code (ECC) — Affaan Mustafa & Contributors (MIT)
    https://github.com/affaan-m/ECC
    Inspiration for PROGRAM 01 (Development Intelligence): skill trigger catalog,
    hook conflict-deduplication, and lazy context-loading patterns.

12. Superpowers — Jesse Vincent (obra) & Contributors (MIT)
    https://github.com/obra/superpowers
    Inspiration for PROGRAM 01: the brainstorm -> plan -> TDD -> implement discipline
    behind AETHER's research-first and Red-Green-Refactor gates.

13. REA (Reverse Engineer Anything) — morluto & Contributors (MIT)
    https://github.com/morluto/rea
    Inspiration for PROGRAM 02 (Reverse Intelligence): read-only application
    analysis, automated technical reporting, and an authorization-only usage posture.

14. OpenHands — All Hands AI & Contributors (MIT)
    https://github.com/All-Hands-AI/OpenHands
    Inspiration for PROGRAM 03 (Autonomous Execution): event-stream execution and
    session resumption, re-implemented at step granularity with crash checkpoints.

15. OpenManus — Foundation Agents (manna_and_poem) & Contributors (MIT)
    https://github.com/FoundationAgents/OpenManus
    Inspiration for PROGRAM 03: general-purpose plan-and-act agent loop with a
    workspace + tool registry.

16. AutoGen — Microsoft & Contributors (MIT code / CC-BY-4.0 docs, ARCHIVED)
    https://github.com/microsoft/autogen
    Architectural reference only for PROGRAM 04 (Multi-Agent Orchestration):
    event-driven agent messaging, group conversations, and agent teams. Successor
    noted: Microsoft Agent Framework (https://github.com/microsoft/agent-framework).
    No AutoGen or Agent Framework dependency was introduced.

17. Browser Use — Gregor Zunic, Browser Use & Contributors (MIT)
    https://github.com/browser-use/browser-use
    Inspiration for PROGRAM 05 (Browser Intelligence): element grounding by bounding
    box and per-action task verification.

18. Agent Browser — Vercel Labs & Contributors (Apache-2.0)
    https://github.com/vercel-labs/agent-browser
    Inspiration for PROGRAM 05: compact accessibility-tree [ref] snapshots as the
    primary low-token browser interaction surface.

19. Skyvern — Skyvern AI & Contributors (AGPL-3.0, out-of-process reference)
    https://github.com/Skyvern-AI/skyvern
    Inspiration for PROGRAM 06 (Visual Computer Intelligence): the vision-driven
    perception -> action loop. Studied out-of-process only; no AGPL code linked.

20. OmniParser — Microsoft & Contributors (CC-BY-4.0)
    https://github.com/microsoft/OmniParser
    Inspiration for PROGRAM 06: GUI element detection and visual grounding,
    re-implemented clean-room in AETHER's perception loop.

21. Lightpanda — Lightpanda & Contributors (AGPL-3.0-only, out-of-process reference)
    https://github.com/lightpanda-io/browser
    Inspiration for PROGRAM 07 (Browser Infrastructure): a lightweight headless CDP
    browser backend. Treated strictly as an out-of-process provider, never a
    drop-in replacement for full browser capability.

22. Playwright — Microsoft & Contributors (Apache-2.0)
    https://github.com/microsoft/playwright
    Inspiration for PROGRAM 07: the cross-browser provider model (Chromium/Firefox/
    WebKit) with accessibility tree, network intercept, and isolated contexts.

23. Puter — Puter Inc. & Contributors (AGPL-3.0-only, out-of-process reference)
    https://github.com/HeyPuter/puter
    Inspiration for PROGRAM 08 (Workspace & Knowledge): browser-based workspace
    environments and extension ecosystems. Studied out-of-process only.

24. Obsidian Releases — Obsidian (public registry; no app source)
    https://github.com/obsidianmd/obsidian-releases
    Inspiration for PROGRAM 08: the public plugin/theme registry model, Markdown
    knowledge vaults, and wiki-link knowledge graphs. Only the public registry is
    studied — the proprietary application source is not involved.

25. ComfyUI — Comfy Org & Contributors (GPL-3.0, out-of-process reference)
    https://github.com/Comfy-Org/ComfyUI
    Inspiration for PROGRAM 09 (Creative & Visual Intelligence): node-based
    workflow composition and image-generation pipeline structure. Modeled as a
    clean-room node-graph scheduler; GPL code is never linked into AETHER.

26. Three.js — Ricardo Cabello (mrdoob) & the three.js authors (MIT)
    https://github.com/mrdoob/three.js
    Inspiration for PROGRAM 09: the 3D scene-graph model (objects, transforms,
    render order) behind AETHER's separate rendering-frontend model.
