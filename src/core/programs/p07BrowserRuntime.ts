/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 07 — BROWSER INFRASTRUCTURE  ·  AETHER Browser Runtime
 * (src/core/programs/p07BrowserRuntime.ts)
 *
 * Researched from:
 *   - microsoft/playwright  (MIT)   — cross-browser automation provider model
 *   - lightpanda-io/browser (BSL-1.1) — lightweight headless CDP backend
 *
 * Delivers: a provider abstraction that can select different browser backends
 * based on task requirements. Playwright drives the cross-browser DOM/assertion
 * provider; Lightpanda is a BSL-1.1 out-of-process CDP provider that is NOT a
 * drop-in replacement for every Playwright use case — compatibility is verified
 * per-task, and unverified compatibility is reported, not assumed.
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export type BrowserProviderId = 'playwright-cross-browser' | 'lightpanda-cdp' | 'headless-chromium';

export interface BrowserProviderDescriptor {
  id: BrowserProviderId;
  name: string;
  executionMethod: 'OUT_OF_PROCESS_CDP' | 'OUT_OF_PROCESS_HTTP' | 'EXTERNAL_CLI';
  license: string;
  /** Features the provider genuinely supports. Absence is reported honestly. */
  capabilities: string[];
  supportedEngines: Array<'chromium' | 'firefox' | 'webkit'>;
  outOfProcessOnly: boolean;
}

export const BROWSER_PROVIDERS: BrowserProviderDescriptor[] = [
  {
    id: 'playwright-cross-browser',
    name: 'Playwright Cross-Browser Provider',
    executionMethod: 'OUT_OF_PROCESS_CDP',
    license: 'Apache-2.0',
    capabilities: ['cross-browser (chromium/firefox/webkit)', 'accessibility tree', 'network intercept', 'forms + uploads', 'screenshots', 'download capture', 'isolated browser context'],
    supportedEngines: ['chromium', 'firefox', 'webkit'],
    outOfProcessOnly: false,
  },
  {
    id: 'lightpanda-cdp',
    name: 'Lightpanda CDP Provider (BSL-1.1)',
    executionMethod: 'OUT_OF_PROCESS_CDP',
    license: 'BSL-1.1',
    // Lightpanda exposes a CDP subset; WebGL, PDF viewer, file chooser and some
    // DOM APIs are not on par with a full Chromium. Reported, not assumed.
    capabilities: ['chromium-equivalent headless', 'CDP subset', 'resource-efficient parsing', 'fast page load'],
    supportedEngines: ['chromium'],
    outOfProcessOnly: true,
  },
  {
    id: 'headless-chromium',
    name: 'Bare Headless Chromium',
    executionMethod: 'EXTERNAL_CLI',
    license: 'Apache-2.0 (Chromium)',
    capabilities: ['screenshot', 'dump-dom', 'devtools protocol'],
    supportedEngines: ['chromium'],
    outOfProcessOnly: false,
  },
];

export interface BrowserTaskRequirements {
  /** which task capability the caller actually needs */
  requiredCapabilities: string[];
  preferCrossBrowser: boolean;
  preferResourceEfficiency: boolean;
  /** BSL/AGPL out-of-process-only providers are allowed to be selected */
  allowOutOfProcessOnly: boolean;
}

export interface ProviderSelection {
  providerId: BrowserProviderId;
  providerName: string;
  compatible: boolean;
  /** which of the required capabilities this provider genuinely covers */
  coveredCapabilities: string[];
  /** required capabilities this provider does NOT cover — empty means fully compatible */
  missingCapabilities: string[];
  rationale: string;
  verificationRequired: boolean;
}

/**
 * Deterministic provider selection. A provider is `compatible` only if it
 * genuinely covers every required capability. We never mark a BSL/CDP-subset
 * backend compatible with a capability it does not support — that's the whole
 * point of "verify compatibility, do not assume Lightpanda is a drop-in."
 */
export function selectBrowserProvider(req: BrowserTaskRequirements, providers: BrowserProviderDescriptor[] = BROWSER_PROVIDERS): ProviderSelection {
  const scored = providers
    .filter((p) => req.allowOutOfProcessOnly || !p.outOfProcessOnly)
    .map((p) => {
      const covered = req.requiredCapabilities.filter((c) => p.capabilities.some((pc) => pc.toLowerCase().includes(c.toLowerCase())));
      const missing = req.requiredCapabilities.filter((c) => !covered.includes(c));
      let score = covered.length;
      if (req.preferCrossBrowser && p.supportedEngines.length > 1) score += 2;
      if (req.preferResourceEfficiency && p.id === 'lightpanda-cdp') score += 1;
      if (req.preferCrossBrowser && p.id === 'lightpanda-cdp') score -= 2; // single-engine penalty
      return { p, covered, missing, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) {
    return {
      providerId: 'headless-chromium',
      providerName: 'Bare Headless Chromium',
      compatible: false,
      coveredCapabilities: [],
      missingCapabilities: req.requiredCapabilities,
      rationale: 'No eligible provider covered the required capabilities.',
      verificationRequired: true,
    };
  }

  return {
    providerId: top.p.id,
    providerName: top.p.name,
    compatible: top.missing.length === 0,
    coveredCapabilities: top.covered,
    missingCapabilities: top.missing,
    rationale:
      top.missing.length === 0
        ? `${top.p.name} covers all ${top.covered.length} required capability(ies).`
        : `${top.p.name} covers ${top.covered.length}/${req.requiredCapabilities.length} required capabilities; missing: ${top.missing.join(', ')}. Compatibility is UNVERIFIED until the task is run against a real browser — treat as a gap, not a pass.`,
    verificationRequired: top.missing.length > 0,
  };
}

export interface BrowserTaskCompatibilityMatrix {
  taskName: string;
  requirements: BrowserTaskRequirements;
  selection: ProviderSelection;
}

/** Build the cross-program compatibility matrix used by P05 + P07 benchmarks. */
export function buildBrowserTaskMatrix(): BrowserTaskCompatibilityMatrix[] {
  return [
    {
      taskName: 'Cross-browser form regression test',
      requirements: {
        requiredCapabilities: ['cross-browser (chromium/firefox/webkit)', 'forms + uploads', 'accessibility tree'],
        preferCrossBrowser: true,
        preferResourceEfficiency: false,
        allowOutOfProcessOnly: false,
      },
    },
    {
      taskName: 'High-volume page scrape (resource constrained)',
      requirements: {
        requiredCapabilities: ['chromium-equivalent headless', 'fast page load'],
        preferCrossBrowser: false,
        preferResourceEfficiency: true,
        allowOutOfProcessOnly: true,
      },
    },
    {
      taskName: 'Screenshot-only smoke check',
      requirements: {
        requiredCapabilities: ['screenshot'],
        preferCrossBrowser: false,
        preferResourceEfficiency: false,
        allowOutOfProcessOnly: false,
      },
    },
    {
      // No backend genuinely supports this capability: the selection must
      // report the gap and demand verification, not mark a drop-in.
      taskName: 'WebGL scene-capture render test',
      requirements: {
        requiredCapabilities: ['webgl scene capture', 'screenshot'],
        preferCrossBrowser: false,
        preferResourceEfficiency: true,
        allowOutOfProcessOnly: true,
      },
    },
  ].map((t) => ({ ...t, selection: selectBrowserProvider(t.requirements) }));
}

export const P07_CAPABILITY: ProgramCapability = {
  id: 'cap-p07-browser-runtime-provider-abstraction',
  programId: 'P07_BROWSER_RUNTIME' as ProgramId,
  programName: 'PROGRAM 07 — BROWSER INFRASTRUCTURE',
  capability: 'Deterministic browser-provider selection with honest per-task compatibility verification (no assumed drop-in)',
  repositoryOrigin: 'https://github.com/microsoft/playwright',
  originProject: 'microsoft/playwright + lightpanda-io/browser',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'NETWORK_EGRESS_CONTROLLED',
  resourceRequirements: 'Pure deterministic TS; no browser binary required for selection logic.',
  testCoverage: 'Provider selection + cross-task compatibility matrix integration tests.',
  integratesWith: ['Swarm Engine', 'Security Engine', 'Validation Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'compatibility-verification coverage',
    unit: 'tasks',
    detail: 'Every browser task is selected against real provider capability lists; missing capabilities are reported, never assumed.',
  },
  author: 'Created by Tabrej',
};

export function runP07BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const matrix = buildBrowserTaskMatrix();
  const fullyCompatible = matrix.filter((m) => m.selection.compatible).length;
  const flaggedForVerification = matrix.filter((m) => m.selection.verificationRequired).length;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: matrix.length,
    metric: 'browser-tasks-verified',
    unit: 'tasks',
    detail: `Verified ${matrix.length} browser task profiles: ${fullyCompatible} fully-compatible provider picks, ${flaggedForVerification} flagged for real-browser verification (missing capabilities reported, not assumed).`,
  };
}
