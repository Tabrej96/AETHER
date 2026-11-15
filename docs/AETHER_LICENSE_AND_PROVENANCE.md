# AETHER License and Provenance

**License:** Apache-2.0
**Copyright:** Tabrej

---

## AETHER Core License

All AETHER core code, documentation, and original implementations are released under the **Apache License 2.0**.

```
Copyright 2025 Tabrej

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## Third-Party Licenses

### Permissive Licenses (Compatible with Apache-2.0)

| Dependency | License | Usage | Version |
|------------|---------|-------|---------|
| Playwright | Apache-2.0 | Browser automation backend | 1.56.1 |
| esbuild | MIT | Binary bundling | Latest |
| TypeScript | Apache-2.0 | Language/compiler | 5.x |
| tsx | MIT | TypeScript execution | Latest |
| zod | MIT | Schema validation | Latest |
| Fastify | MIT | Server framework | Latest |

### Inspiration Sources (NOT incorporated — design reference only)

| Repository | License | Relationship | URL |
|------------|---------|-------------|-----|
| ECC | MIT | Design inspiration for skill discovery | https://github.com/affaan-m/ECC |
| Superpowers | MIT | Design inspiration for dev workflows | https://github.com/obra/superpowers |
| OpenHands | MIT | Architecture reference for autonomous execution | https://github.com/All-Hands-AI/OpenHands |
| OpenManus | MIT | Architecture reference for agent design | https://github.com/FoundationAgents/OpenManus |
| AutoGen | MIT | Architectural research reference (archived) | https://github.com/microsoft/autogen |
| Browser Use | MIT | Design inspiration for browser control | https://github.com/browser-use/browser-use |
| Agent Browser | MIT | Design inspiration for browser interaction | https://github.com/vercel-labs/agent-browser |
| Skyvern | AGPL-3.0 | Design inspiration for visual automation | https://github.com/Skyvern-AI/skyvern |
| OmniParser | MIT | Design inspiration for UI element detection | https://github.com/microsoft/OmniParser |
| Playwright | Apache-2.0 | Browser automation backend | https://github.com/microsoft/playwright |
| Lightpanda | BSD-3-Clause | Browser architecture research | https://github.com/lightpanda-io/browser |
| Puter | AGPL-3.0 | Workspace design inspiration | https://github.com/HeyPuter/puter |
| Obsidian | Proprietary | Knowledge vault patterns (public ecosystem only) | https://github.com/obsidianmd/obsidian-releases |
| ComfyUI | GPL-3.0 | Workflow composition patterns | https://github.com/Comfy-Org/ComfyUI |
| Three.js | MIT | 3D rendering concepts | https://github.com/mrdoob/three.js |
| REA | MIT | Reverse engineering methodology | https://github.com/morluto/rea |

---

## License Compliance Notes

1. **AGPL-3.0 (Skyvern, Puter):** AETHER uses these projects as design inspiration only. No source code is incorporated. AGPL copyleft obligations do not apply to AETHER.

2. **GPL-3.0 (ComfyUI):** AETHER uses ComfyUI as design inspiration for workflow composition. No GPL-licensed source code is incorporated into AETHER.

3. **BSD-3-Clause (Lightpanda):** Compatible with Apache-2.0. Lightpanda concepts are used in AETHER's browser provider abstraction.

4. **Proprietary (Obsidian):** AETHER only references the public Obsidian extension ecosystem patterns. No proprietary Obsidian code is used.

5. **MIT (all others):** Fully compatible with Apache-2.0. Inspiration and patterns only.

---

## Attribution Requirements

All AETHER documentation and UI that references external projects MUST include attribution:

```
Inspiration credits: [Project Name] by [Author] — https://github.com/[owner]/[repo]
```

This applies to:
- File headers of modules inspired by external projects
- Website pages describing capabilities
- Documentation files
- Release notes

---

## Provenance Verification

All third-party code incorporated into AETHER (not just inspiration) undergoes:
1. License compatibility check
2. Copyright notice preservation
3. Attribution in NOTICE file
4. Security audit

Currently, AETHER uses zero third-party source code — all implementations are original work inspired by external designs.
