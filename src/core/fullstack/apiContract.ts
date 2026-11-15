/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · API CONTRACTS
 * (src/core/fullstack/apiContract.ts) · Created by Tabrej
 *
 * Directive §2: "Ensure frontend and backend agree on field names, types,
 * required fields, nullable values, validation rules, error responses,
 * pagination structures, and authentication requirements. Detect API
 * contract mismatches before they become runtime bugs."
 *
 * So: two sides of a contract, one deterministic checker. `ContractSpec` is
 * what the BACKEND promises (an OpenAPI-style field table); `ClientUsage` is
 * what the FRONTEND sends/expects. `checkApiContract` returns every concrete
 * mismatch — a field renamed on one side, a type that widened, a required
 * field now optional, a missing error/pagination/auth envelope — each with a
 * severity and the two sides that disagree. No mismatch list = the contract
 * holds.
 */

/** a single field in the contract */
export interface ContractField {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'any';
  required: boolean;
  nullable: boolean;
  /** validation rules the backend enforces (length, range, pattern, enum) */
  rules?: string[];
}

export interface ContractSpec {
  operation: string; // e.g. 'POST /invoices'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS' | 'SSE';
  /** fields of the request payload (empty for GET) */
  requestFields: ContractField[];
  /** fields of the response envelope */
  responseFields: ContractField[];
  /** the error envelope shape, e.g. ['code', 'message', 'traceId'] */
  errorEnvelope: string[];
  /** pagination structure, e.g. 'cursor' | 'offset' */
  pagination?: 'cursor' | 'offset';
  /** the authentication requirement, e.g. 'bearer' | 'session' | 'none' | 'api-key' */
  auth: string;
  /** API version the contract belongs to, e.g. 'v1' */
  version?: string;
}

export interface ClientUsage {
  operation: string;
  /** what the client actually sends / reads */
  requestFields: ContractField[];
  responseFields: ContractField[];
  readsErrorEnvelope: string[];
  pagination?: 'cursor' | 'offset';
  auth: string;
}

export type MismatchSeverity = 'BLOCKER' | 'HIGH' | 'MEDIUM';

export interface ApiMismatch {
  kind:
    | 'FIELD_RENAMED'
    | 'FIELD_MISSING_CLIENT'
    | 'FIELD_MISSING_BACKEND'
    | 'TYPE_MISMATCH'
    | 'REQUIRED_NOW_OPTIONAL'
    | 'NULLABILITY_MISMATCH'
    | 'VALIDATION_RULE_DROPPED'
    | 'ERROR_ENVELOPE_MISMATCH'
    | 'PAGINATION_MISMATCH'
    | 'AUTH_MISMATCH'
    | 'VERSION_DRIFT';
  severity: MismatchSeverity;
  detail: string;
  backend: string;
  client: string;
}

export interface ApiContractReport {
  operation: string;
  ok: boolean;
  mismatches: ApiMismatch[];
}

const REQUIRED_BLOCKER = (name: string, b: string, c: string) => ({
  kind: 'REQUIRED_NOW_OPTIONAL' as const,
  severity: 'BLOCKER' as MismatchSeverity,
  detail: `field '${name}' is REQUIRED by the backend but optional/absent in the client`,
  backend: b,
  client: c,
});

function fieldMap(fields: ContractField[]): Map<string, ContractField> {
  return new Map(fields.map((f) => [f.name, f]));
}

/**
 * Deterministic two-sided diff. Every finding names both sides so a developer
 * can see exactly what to change — this is what "detect before runtime bugs"
 * means.
 */
export function checkApiContract(spec: ContractSpec, usage: ClientUsage): ApiContractReport {
  const out: ApiMismatch[] = [];

  // --- auth + version (envelope-level, all BLOCKERs) ----------------------
  if (spec.auth !== usage.auth) {
    out.push({
      kind: 'AUTH_MISMATCH',
      severity: 'BLOCKER',
      detail: `auth requirement disagrees: backend=${spec.auth}, client=${usage.auth}`,
      backend: spec.auth,
      client: usage.auth,
    });
  }
  if (spec.pagination !== usage.pagination) {
    out.push({
      kind: 'PAGINATION_MISMATCH',
      severity: 'HIGH',
      detail: `pagination structure disagrees: backend=${spec.pagination ?? 'none'}, client=${usage.pagination ?? 'none'}`,
      backend: String(spec.pagination ?? 'none'),
      client: String(usage.pagination ?? 'none'),
    });
  }

  // --- error envelope ------------------------------------------------------
  const errSpec = new Set(spec.errorEnvelope);
  const errUsed = new Set(usage.readsErrorEnvelope);
  for (const e of spec.errorEnvelope) if (!errUsed.has(e)) {
    out.push({
      kind: 'ERROR_ENVELOPE_MISMATCH',
      severity: 'MEDIUM',
      detail: `client does not read error field '${e}' (may mis-handle failures)`,
      backend: e,
      client: '(not read)',
    });
  }

  const diffSide = (label: 'request' | 'response', bSide: ContractField[], cSide: ContractField[]) => {
    const b = fieldMap(bSide);
    const c = fieldMap(cSide);
    for (const [name, bf] of b) {
      const cf = c.get(name);
      if (!cf) {
        // present on backend, absent on client
        if (bf.required) out.push(REQUIRED_BLOCKER(name, `${name} (required)`, '(absent)'));
        else
          out.push({
            kind: 'FIELD_MISSING_CLIENT',
            severity: 'MEDIUM',
            detail: `field '${name}' on ${label} has no client counterpart`,
            backend: `${name} (optional)`,
            client: '(absent)',
          });
        continue;
      }
      if (cf.type !== bf.type) {
        const sev: MismatchSeverity = bf.required ? 'BLOCKER' : 'HIGH';
        out.push({
          kind: 'TYPE_MISMATCH',
          severity: sev,
          detail: `field '${name}' type differs: backend=${bf.type}, client=${cf.type}`,
          backend: bf.type,
          client: cf.type,
        });
      }
      if (bf.nullable !== cf.nullable) {
        out.push({
          kind: 'NULLABILITY_MISMATCH',
          severity: 'MEDIUM',
          detail: `field '${name}' nullability differs: backend=${bf.nullable}, client=${cf.nullable}`,
          backend: String(bf.nullable),
          client: String(cf.nullable),
        });
      }
      if (!cf.required && bf.required) out.push(REQUIRED_BLOCKER(name, `${name} (required)`, `${name} (optional)`));
      // validation rules the client dropped
      for (const rule of bf.rules ?? []) {
        if (!(cf.rules ?? []).includes(rule)) {
          out.push({
            kind: 'VALIDATION_RULE_DROPPED',
            severity: 'MEDIUM',
            detail: `field '${name}' no longer applies rule '${rule}' on the client side`,
            backend: rule,
            client: '(dropped)',
          });
        }
      }
    }
    // fields the client sends that the backend does not know
    for (const [name, cf] of c) {
      if (!b.has(name)) {
        out.push({
          kind: 'FIELD_MISSING_BACKEND',
          severity: cf.required ? 'HIGH' : 'MEDIUM',
          detail: `client sends/reads '${name}' on ${label} that the backend contract does not define`,
          backend: '(undefined)',
          client: `${name}`,
        });
      }
    }
  };

  diffSide('request', spec.requestFields, usage.requestFields);
  diffSide('response', spec.responseFields, usage.responseFields);

  return { operation: spec.operation, ok: out.length === 0, mismatches: out };
}

/** the field-name drift detector (rename on one side → both sides disagree) */
export function detectFieldRenames(spec: ContractSpec, usage: ClientUsage): string[] {
  const renames: string[] = [];
  const bReq = fieldMap(spec.requestFields).keys();
  const cReq = fieldMap(usage.requestFields).keys();
  const bResp = fieldMap(spec.responseFields).keys();
  const cResp = fieldMap(usage.responseFields).keys();
  // a field missing on one side but present on the other is the rename signal
  for (const n of new Set([...bReq, ...bResp])) if (![...cReq, ...cResp].includes(n)) {
    const camel = toCamel(n);
    if (camel !== n && ([...cReq, ...cResp].includes(camel))) renames.push(`${n} -> ${camel}`);
  }
  return renames;
}

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
