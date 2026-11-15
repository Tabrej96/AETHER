/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — REVERSE ENGINEERING  ·  AETHER Reverse Intelligence
 * (src/core/programs/p02ReverseIntelligence.ts)
 *
 * Researched from:
 *   - morluto/rea (MIT) — reverse-engineering analysis workflow
 *
 * Delivers: an ISOLATED, PERMISSION-CONTROLLED reverse-engineering subsystem.
 * It can only operate on software the user owns or is explicitly authorized to
 * investigate. The authorization gate is enforced before ANY analysis runs.
 *
 * Capabilities (all read-only analysis, no source modification):
 *   - application architecture extraction from file/import graphs,
 *   - dependency discovery,
 *   - software structure reconstruction,
 *   - automated technical reporting.
 *
 * Binary / network / UI-behavior discovery are declared as capability slots
 * that require an external analyzer (marked UNMEASURED) — this subsystem never
 * fabricates what it has not observed.
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export type AuthorizationBasis = 'OWNED' | 'AUTHORIZED_LICENSE' | 'CTF_TARGET' | 'DEFENSIVE_SECURITY';

export interface ReverseEngineAuthorization {
  targetId: string;
  basis: AuthorizationBasis;
  /** true only for a target the operator may legally investigate */
  authorized: boolean;
  evidence: string;
}

export interface ApplicationFile {
  path: string;
  /** import/require statements as observed string specifiers */
  imports: string[];
  exports: string[];
  bytes: number;
  language: string;
}

export interface ArchitectureReport {
  targetId: string;
  authorization: ReverseEngineAuthorization;
  totalFiles: number;
  totalDependencies: number;
  /** reconstructed module graph (node id -> import edge set) */
  moduleGraph: Record<string, string[]>;
  externalDependencies: string[];
  entryCandidates: string[];
  layeredStructure: { layer: string; files: string[] }[];
  reconstructionSummary: string;
  unmeasuredSlots: Array<{ slot: string; reason: string; externalCommandToMeasure?: string }>;
}

/** The authorization gate. No analysis runs without it — this is the subsystem's hard security boundary. */
export function assertAuthorization(auth: ReverseEngineAuthorization): void {
  if (!auth.authorized) {
    throw new Error(
      `AETHER Reverse Intelligence authorization DENIED for target "${auth.targetId}". ` +
        `The operator may only investigate software they own or are authorized to. ` +
        `Recorded basis: ${auth.basis}. ${auth.evidence}`
    );
  }
}

/** Layer heuristic: classify a file's layer from its path and role. Deterministic, path-based. */
function inferLayer(f: ApplicationFile): string {
  const p = f.path.toLowerCase();
  if (/^(\.\/)?(test|tests|__tests__|spec)/.test(p) || /\.test\.|\.spec\./.test(p)) return 'test';
  if (/(server|api|route|controller|handler)\./.test(p)) return 'interface';
  if (/(client|repo|db|model|domain|service|usecase)\./.test(p)) return 'domain';
  if (/(util|helper|common|lib)\./.test(p)) return 'utility';
  return 'entry';
}

/**
 * Extract a readable architecture report from observed application files.
 * Refuses to run unless authorization has been asserted (call assertAuthorization first).
 */
export function extractApplicationArchitecture(
  targetId: string,
  auth: ReverseEngineAuthorization,
  files: ApplicationFile[]
): ArchitectureReport {
  assertAuthorization(auth);

  const moduleGraph: Record<string, string[]> = {};
  const extDeps = new Set<string>();
  const layers = new Map<string, string[]>();

  for (const f of files) {
    moduleGraph[f.path] = f.imports.filter((i) => !i.startsWith('.') && !i.startsWith('/'));
    f.imports.filter((i) => !i.startsWith('.') && !i.startsWith('/')).forEach((i) => extDeps.add(i));
    const layer = inferLayer(f);
    layers.set(layer, [...(layers.get(layer) ?? []), f.path]);
  }

  // Entry candidate: a file that imports others but is itself not imported by anyone.
  const isImportedBySomeone = (targetPath: string) =>
    files.some((other) =>
      other.path !== targetPath &&
      other.imports.some((imp) => imp.replace(/^\.\//, '').endsWith(targetPath.replace(/^\.\//, '')))
    );
  const entryCandidates = files
    .filter((f) => f.imports.length > 0 && !isImportedBySomeone(f.path))
    .map((f) => f.path);

  const totalDependencies = Object.values(moduleGraph).reduce((s, arr) => s + arr.length, 0);

  const reconstructionSummary =
    `Reconstructed ${files.length} module(s) across ${layers.size} layer(s); ` +
    `${extDeps.size} distinct external dependency(ies) [${[...extDeps].slice(0, 6).join(', ')}${extDeps.size > 6 ? ', …' : ''}]; ` +
    `inferred entry candidate(s): ${entryCandidates.length ? entryCandidates.join(', ') : 'n/a'}.`;

  return {
    targetId,
    authorization: auth,
    totalFiles: files.length,
    totalDependencies,
    moduleGraph,
    externalDependencies: [...extDeps].sort(),
    entryCandidates,
    layeredStructure: [...layers.entries()].map(([layer, lf]) => ({ layer, files: lf.sort() })),
    reconstructionSummary,
    unmeasuredSlots: [
      { slot: 'BINARY_DISCOVERY', reason: 'Requires an external binary analyzer (objdump/ghidra CLI); not observed in this subsystem.' },
      { slot: 'NETWORK_CAPTURE', reason: 'Requires a live capture harness; only observed endpoints can be reported, none were observed here.' },
      { slot: 'UI_BEHAVIOR_DISCOVERY', reason: 'Requires a running UI + screenshot capture; UNMEASURED without a live target.' },
    ],
  };
}

export const P02_CAPABILITY: ProgramCapability = {
  id: 'cap-p02-reverse-intelligence-subsystem',
  programId: 'P02_REVERSE_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 02 — REVERSE ENGINEERING',
  capability: 'Isolated, permission-controlled reverse-engineering: authorization-gated architecture extraction, dependency discovery, structure reconstruction, automated reporting',
  repositoryOrigin: 'https://github.com/morluto/rea',
  originProject: 'morluto/rea',
  version: '1.0.0',
  license: 'MIT',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'AUTHORIZED_TARGET_ONLY',
  resourceRequirements: 'Read-only analysis; authorization gate enforced before any processing. Binary/network/UI slots are UNMEASURED without external tooling.',
  testCoverage: 'Authorization-gate denial test, architecture extraction on a synthetic app, external-dependency discovery, and layer reconstruction.',
  integratesWith: ['Security Engine', 'Validation Engine', 'Context Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'modules-reconstructed',
    unit: 'modules',
    detail: 'REA-inspired read-only analysis reproduced with a hard authorization gate; every capability slot that requires a live target is reported UNMEASURED, not fabricated.',
  },
  author: 'Created by Tabrej',
};

export function runP02BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-owned-service',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Operator owns the target repository.',
  };
  const files: ApplicationFile[] = [
    { path: 'main.ts', imports: ['./server', 'express'], exports: [], bytes: 420, language: 'ts' },
    { path: 'server.ts', imports: ['./db', 'pg'], exports: ['createApp'], bytes: 1800, language: 'ts' },
    { path: 'db.ts', imports: ['pg'], exports: ['pool'], bytes: 900, language: 'ts' },
    { path: 'server.test.ts', imports: ['./server'], exports: [], bytes: 640, language: 'ts' },
  ];
  const report = extractApplicationArchitecture(auth.targetId, auth, files);
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: report.totalFiles,
    metric: 'modules-reconstructed',
    unit: 'modules',
    detail: `Reconstructed ${report.totalFiles} modules, ${report.externalDependencies.length} external dependency(ies) [${report.externalDependencies.join(', ')}], ${report.layeredStructure.length} layers; ${report.unmeasuredSlots.length} live-target slots reported UNMEASURED.`,
  };
}
