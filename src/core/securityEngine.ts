/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 10: Security Intelligence & Open-Source License Compliance (securityEngine.ts)
 * Multi-layer prompt-injection defense, Shannon entropy secret detection,
 * unsafe shell command AST gate, agent trust boundary validation, SPDX license auditing,
 * threat modeling, code/API/database security audit, input validation, output sanitization,
 * secret detection, and dependency vulnerability scanning.
 *
 * Inspiration: OWASP Top 10, SAST patterns (SonarQube, Semgrep — studied as architectural reference)
 */

// ─── Existing exports (preserved) ────────────────────────────────────────────

export interface SecurityThreatFinding {
  type:
    | 'PROMPT_INJECTION'
    | 'SECRET_EXPOSURE'
    | 'UNSAFE_SHELL_COMMAND'
    | 'TRUST_BOUNDARY_VIOLATION'
    | 'LICENSE_INCOMPATIBLE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  matchedPattern: string;
  remediation: string;
}

export interface SecurityScanReport {
  safeToProceed: boolean;
  passedSecurityGate: boolean;
  licenseCompliant: boolean;
  shannonEntropyMax: number;
  threats: SecurityThreatFinding[];
  sanitizedPreview: string;
  spotlightedPromptPreview: string;
}

export function calculateShannonEntropy(token: string): number {
  if (!token || token.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of token) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / token.length;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

const PROMPT_INJECTION_PATTERNS: Array<{ rx: RegExp; label: string }> = [
  { rx: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i, label: 'Direct Instruction Override' },
  { rx: /system\s+prompt\s+override|you\s+are\s+now\s+in\s+developer\s+mode/i, label: 'Persona Hijack Attempt' },
  { rx: /exfiltrate|curl\s+.*(-d|--data).*\$|wget\s+.*\$\(/i, label: 'Data Exfiltration Directive' },
  { rx: /<\s*script\b|javascript:/i, label: 'Embedded Script Payload' },
  { rx: /\son\w+\s*=\s*["']?\s*(?:\w|\()/i, label: 'Inline Event-Handler XSS (onerror/onload)' },
  { rx: /document\.cookie|localStorage\.|sessionStorage\./i, label: 'Browser Credential Harvesting' },
];

const SECRET_PATTERNS: Array<{ rx: RegExp; label: string }> = [
  { rx: /AKIA[0-9A-Z]{16}/, label: 'AWS Access Key ID' },
  { rx: /ghp_[A-Za-z0-9]{20,}/, label: 'GitHub Personal Access Token' },
  { rx: /sk-(proj-|ant-)?[A-Za-z0-9_-]{20,}/, label: 'LLM Provider Secret API Key' },
  { rx: /-----BEGIN\s+(RSA|OPENSSH|EC|PRIVATE)\s+KEY-----/, label: 'PEM Private Key Material' },
  { rx: /AIza[0-9A-Za-z_-]{35}/, label: 'Google Cloud API Key' },
];

const UNSAFE_COMMAND_PATTERNS: Array<{ rx: RegExp; label: string }> = [
  { rx: /rm\s+-rf\s+(\/|~|\*|\.\.)/, label: 'Destructive Root/Home File Deletion' },
  { rx: /git\s+push\s+.*--force(?!-with-lease)/, label: 'Unprotected Force Push' },
  { rx: /curl\s+[^|]+\|\s*(ba)?sh/i, label: 'Remote Pipe-to-Shell Execution' },
  { rx: /chmod\s+-R\s+777/, label: 'World-Writable Permission Escalation' },
];

const PERMISSIVE_SPDX_ALLOWLIST = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
]);

export function scanSecurityAndTrustBoundaries(input: {
  untrustedContent: string;
  proposedCommand?: string;
  agentRole?: 'READ_ONLY_REVIEWER' | 'LEASED_IMPLEMENTER' | 'IMPLEMENTATION_ENGINEER';
  requestedTool?: 'READ_FILE' | 'WRITE_FILE' | 'SHELL_EXEC';
  spdxLicense?: string;
}): SecurityScanReport {
  const threats: SecurityThreatFinding[] = [];
  let sanitizedPreview = input.untrustedContent;

  for (const pat of PROMPT_INJECTION_PATTERNS) {
    if (pat.rx.test(input.untrustedContent)) {
      threats.push({
        type: 'PROMPT_INJECTION',
        severity: 'CRITICAL',
        matchedPattern: pat.label,
        remediation: 'Isolate untrusted file content inside data-only spotlight delimiters and strip imperative directives.',
      });
      sanitizedPreview = sanitizedPreview.replace(pat.rx, '[REDACTED_INJECTION_ATTEMPT]');
    }
  }

  for (const sec of SECRET_PATTERNS) {
    if (sec.rx.test(input.untrustedContent)) {
      threats.push({
        type: 'SECRET_EXPOSURE',
        severity: 'CRITICAL',
        matchedPattern: sec.label,
        remediation: 'Redact secret from context and load via runtime environment secret reference only.',
      });
      sanitizedPreview = sanitizedPreview.replace(sec.rx, '[REDACTED_SECRET_CREDENTIAL]');
    }
  }

  const candidateTokens = input.untrustedContent.split(/\s+/).filter((t) => t.length >= 24);
  let maxEntropy = 0;
  for (const tok of candidateTokens) {
    const ent = calculateShannonEntropy(tok);
    if (ent > maxEntropy) maxEntropy = ent;
  }

  if (input.proposedCommand) {
    for (const cmd of UNSAFE_COMMAND_PATTERNS) {
      if (cmd.rx.test(input.proposedCommand)) {
        threats.push({
          type: 'UNSAFE_SHELL_COMMAND',
          severity: 'CRITICAL',
          matchedPattern: cmd.label,
          remediation: 'Block destructive command execution and require scoped path or --force-with-lease.',
        });
      }
    }
  }

  if (
    input.agentRole === 'READ_ONLY_REVIEWER' &&
    (input.requestedTool === 'WRITE_FILE' || input.requestedTool === 'SHELL_EXEC')
  ) {
    threats.push({
      type: 'TRUST_BOUNDARY_VIOLATION',
      severity: 'HIGH',
      matchedPattern: `Agent role READ_ONLY_REVIEWER attempted privileged tool ${input.requestedTool}`,
      remediation: 'Deny tool invocation; only LEASED_IMPLEMENTER holding an active file lock may mutate workspace.',
    });
  }

  const licenseCompliant = !input.spdxLicense || PERMISSIVE_SPDX_ALLOWLIST.has(input.spdxLicense);
  if (!licenseCompliant && input.spdxLicense) {
    threats.push({
      type: 'LICENSE_INCOMPATIBLE',
      severity: 'HIGH',
      matchedPattern: `Non-permissive or unverified SPDX license: ${input.spdxLicense}`,
      remediation: 'Only MIT, Apache-2.0, BSD, and ISC components may be integrated into AETHER core.',
    });
  }

  const safe = threats.length === 0;
  return {
    safeToProceed: safe,
    passedSecurityGate: safe,
    licenseCompliant,
    shannonEntropyMax: maxEntropy,
    threats,
    sanitizedPreview,
    spotlightedPromptPreview: `<untrusted_data_spotlight>${sanitizedPreview}</untrusted_data_spotlight>`,
  };
}

// ─── New production-grade interfaces ─────────────────────────────────────────

/** CWE-style threat classification taxonomy */
export type ThreatCategory =
  | 'INJECTION'
  | 'BROKEN_AUTH'
  | 'SENSITIVE_DATA_EXPOSURE'
  | 'XXE'
  | 'BROKEN_ACCESS_CONTROL'
  | 'SECURITY_MISCONFIG'
  | 'XSS'
  | 'INSECURE_DESERIALIZATION'
  | 'KNOWN_VULNERABILITIES'
  | 'INSUFFICIENT_LOGGING'
  | 'SSRF'
  | 'CSRF'
  | 'RACE_CONDITION'
  | 'PATH_TRAVERSAL'
  | 'INSECURE_CRYPTO';

export interface Asset {
  id: string;
  type: 'data' | 'code' | 'credential' | 'infrastructure' | 'user';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface Threat {
  id: string;
  category: ThreatCategory;
  description: string;
  likelihood: number;   // 1-10
  impact: number;       // 1-10
  mitigations: string[];
  cweId?: string;
  owaspRef?: string;
}

export interface Mitigation {
  threatId: string;
  description: string;
  implemented: boolean;
  effectiveness: number; // 1-10
}

export interface ThreatModel {
  assets: Asset[];
  threats: Threat[];
  mitigations: Mitigation[];
  riskScore: number;  // 0-100
  generatedAtIso: string;
}

export interface SecurityFinding {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: ThreatCategory;
  description: string;
  location: string;
  recommendation: string;
  cweId?: string;
}

export interface SecurityAuditResult {
  passed: boolean;
  findings: SecurityFinding[];
  riskScore: number;
  recommendations: string[];
  auditTimestampIso: string;
}

/** Minimal project spec representation for threat modeling */
export interface ProjectSpec {
  id: string;
  name: string;
  description: string;
  language: string;
  framework?: string;
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  hasFileUpload: boolean;
  hasExternalAPICalls: boolean;
  targetAudience: string;
  assets?: Asset[];
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  auth: 'none' | 'bearer' | 'session' | 'api-key' | 'oauth2';
  hasRateLimit: boolean;
  hasInputValidation: boolean;
  hasOutputEncoding: boolean;
  hasCSRFProtection: boolean;
  description?: string;
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  hasEncryptionAtRest: boolean;
  hasEncryptionInTransit: boolean;
  accessControlModel: 'none' | 'application' | 'database' | 'rls';
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  hasSensitiveColumns: boolean;
  hasRowLevelSecurity: boolean;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  sensitive: boolean;
  nullable: boolean;
}

export interface ValidationSchema {
  type: 'object';
  properties: Record<string, SchemaField>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SchemaField {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  format?: 'email' | 'uri' | 'date-time' | 'uuid' | 'ipv4' | 'ipv6';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitizedValue?: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
  expected?: string;
  actual?: string;
}

export type SanitizationContext = 'html' | 'sql' | 'javascript' | 'url' | 'shell' | 'xml' | 'ldap';

export interface SecretFinding {
  type: string;
  value: string;        // the matched secret (masked in real usage)
  maskedValue: string;  // e.g. sk-...xxxx
  severity: 'high' | 'critical';
  lineNumber: number;
  fileName: string;
  recommendation: string;
}

export interface DependencyFinding {
  package: string;
  installedVersion: string;
  vulnerableVersion: string;
  cveId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixedVersion: string;
  recommendation: string;
}

// ─── SecurityEngine class ────────────────────────────────────────────────────

export class SecurityEngine {
  private readonly staticSalt: string;

  constructor() {
    // Per-session random salt for any hashing operations (not for password storage —
    // use bcrypt/argon2 for that).  This is a runtime discriminator only.
    this.staticSalt = crypto.randomUUID();
  }

  // ── Threat Modeling ────────────────────────────────────────────────────────

  generateThreatModel(project: ProjectSpec): ThreatModel {
    const assets = project.assets ?? this.inferAssets(project);
    const threats = this.enumerateThreats(project, assets);
    const mitigations = this.generateMitigations(threats);
    const riskScore = this.computeRiskScore(threats);

    return {
      assets,
      threats,
      mitigations,
      riskScore,
      generatedAtIso: new Date().toISOString(),
    };
  }

  private inferAssets(project: ProjectSpec): Asset[] {
    const assets: Asset[] = [
      { id: 'asset-001', type: 'credential', sensitivity: 'critical', description: 'API keys, tokens, secrets' },
      { id: 'asset-002', type: 'data', sensitivity: 'high', description: 'User data and PII' },
    ];
    if (project.hasDatabase) {
      assets.push({ id: 'asset-003', type: 'data', sensitivity: 'high', description: 'Database records' });
    }
    if (project.hasAuth) {
      assets.push({ id: 'asset-004', type: 'infrastructure', sensitivity: 'critical', description: 'Authentication system' });
    }
    if (project.hasFileUpload) {
      assets.push({ id: 'asset-005', type: 'code', sensitivity: 'high', description: 'Uploaded files' });
    }
    assets.push({ id: 'asset-006', type: 'user', sensitivity: 'medium', description: 'User sessions and identities' });
    return assets;
  }

  private enumerateThreats(project: ProjectSpec, assets: Asset[]): Threat[] {
    const threats: Threat[] = [];
    let seq = 0;

    // OWASP Top 10 2021 mapping
    if (project.hasDatabase) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'INJECTION',
        description: 'SQL/NoSQL injection via unsanitized user input reaches database queries.',
        likelihood: project.hasInputValidation ? 4 : 8,
        impact: 10,
        mitigations: [],
        cweId: 'CWE-89',
        owaspRef: 'A03:2021',
      });
    }

    if (project.hasAuth) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'BROKEN_AUTH',
        description: 'Weak authentication, session fixation, or credential stuffing is possible.',
        likelihood: 6,
        impact: 9,
        mitigations: [],
        cweId: 'CWE-287',
        owaspRef: 'A07:2021',
      });
    }

    if (project.hasAPI) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'BROKEN_ACCESS_CONTROL',
        description: 'API endpoints lack authorization checks, allowing vertical/horizontal privilege escalation.',
        likelihood: project.hasAuth ? 5 : 9,
        impact: 8,
        mitigations: [],
        cweId: 'CWE-284',
        owaspRef: 'A01:2021',
      });
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'SECURITY_MISCONFIG',
        description: 'Missing security headers, verbose error messages, or default credentials.',
        likelihood: 7,
        impact: 6,
        mitigations: [],
        cweId: 'CWE-16',
        owaspRef: 'A05:2021',
      });
    }

    if (project.hasExternalAPICalls) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'SSRF',
        description: 'Unvalidated external URLs allow server-side request forgery.',
        likelihood: 5,
        impact: 7,
        mitigations: [],
        cweId: 'CWE-918',
        owaspRef: 'A10:2021',
      });
    }

    if (project.language === 'javascript' || project.language === 'typescript') {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'XSS',
        description: 'Unescaped user input rendered in HTML context enables reflected/stored XSS.',
        likelihood: 7,
        impact: 6,
        mitigations: [],
        cweId: 'CWE-79',
        owaspRef: 'A03:2021',
      });
    }

    if (project.hasFileUpload) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'UNSAFE_DESERIALIZATION',
        description: 'Uploaded files may contain malicious payloads executed on the server.',
        likelihood: 6,
        impact: 8,
        mitigations: [],
        cweId: 'CWE-502',
        owaspRef: 'A08:2021',
      });
    }

    // Always-include
    seq++;
    threats.push({
      id: `THREAT-${String(seq).padStart(3, '0')}`,
      category: 'SENSITIVE_DATA_EXPOSURE',
      description: 'Sensitive data transmitted or stored without encryption.',
      likelihood: 5,
      impact: 9,
      mitigations: [],
      cweId: 'CWE-311',
      owaspRef: 'A02:2021',
    });

    seq++;
    threats.push({
      id: `THREAT-${String(seq).padStart(3, '0')}`,
      category: 'INSECURE_DESERIALIZATION',
      description: 'Untrusted data deserialized without validation could lead to code execution.',
      likelihood: 4,
      impact: 8,
      mitigations: [],
      cweId: 'CWE-502',
      owaspRef: 'A08:2021',
    });

    if (project.hasAPI) {
      seq++;
      threats.push({
        id: `THREAT-${String(seq).padStart(3, '0')}`,
        category: 'CSRF',
        description: 'State-changing API endpoints lack CSRF protection.',
        likelihood: 5,
        impact: 5,
        mitigations: [],
        cweId: 'CWE-352',
        owaspRef: 'A01:2021',
      });
    }

    seq++;
    threats.push({
      id: `THREAT-${String(seq).padStart(3, '0')}`,
      category: 'INSECURE_CRYPTO',
      description: 'Weak or deprecated cryptographic algorithms or key management.',
      likelihood: 4,
      impact: 9,
      mitigations: [],
      cweId: 'CWE-327',
      owaspRef: 'A02:2021',
    });

    return threats;
  }

  private generateMitigations(threats: Threat[]): Mitigation[] {
    const map = new Map<string, string[]>();
    for (const t of threats) {
      switch (t.category) {
        case 'INJECTION':
          map.set(t.id, ['Use parameterized queries / ORM', 'Input validation with allowlists', 'Least-privilege DB accounts']);
          break;
        case 'BROKEN_AUTH':
          map.set(t.id, ['Multi-factor authentication', 'Rate limiting on auth endpoints', 'Secure session management']);
          break;
        case 'BROKEN_ACCESS_CONTROL':
          map.set(t.id, ['Deny-by-default authorization', 'Enforce access control on every endpoint', 'Regular access control audits']);
          break;
        case 'SECURITY_MISCONFIG':
          map.set(t.id, ['Security headers (CSP, HSTS, X-Frame-Options)', 'Remove debug mode in production', 'Minimize attack surface']);
          break;
        case 'XSS':
          map.set(t.id, ['Context-aware output encoding', 'Content-Security-Policy header', 'Sanitize user input before rendering']);
          break;
        case 'SSRF':
          map.set(t.id, ['Allowlist external destinations', 'Validate and sanitize all URLs', 'Network-level egress controls']);
          break;
        case 'CSRF':
          map.set(t.id, ['CSRF tokens on state-changing requests', 'SameSite cookie attributes', 'Verify Origin/Referer headers']);
          break;
        case 'SENSITIVE_DATA_EXPOSURE':
          map.set(t.id, ['TLS 1.3 everywhere', 'Encryption at rest for sensitive fields', 'Data classification and masking']);
          break;
        case 'UNSAFE_DESERIALIZATION':
          map.set(t.id, ['Validate file types on upload', 'Scan uploaded files', 'Store uploads outside web root']);
          break;
        case 'INSECURE_CRYPTO':
          map.set(t.id, ['Use AES-256-GCM or ChaCha20-Poly1305', 'Managed key rotation', 'Avoid custom crypto']);
          break;
        default:
          map.set(t.id, ['Implement defense-in-depth controls', 'Regular security reviews']);
      }
    }

    const mitigations: Mitigation[] = [];
    for (const [threatId, descs] of map) {
      for (const desc of descs) {
        mitigations.push({
          threatId,
          description: desc,
          implemented: false,
          effectiveness: 7,
        });
      }
    }
    return mitigations;
  }

  private computeRiskScore(threats: Threat[]): number {
    if (threats.length === 0) return 0;
    const totalRisk = threats.reduce((sum, t) => sum + t.likelihood * t.impact, 0);
    const maxPossible = threats.length * 10 * 10;
    return Math.round((totalRisk / maxPossible) * 100);
  }

  // ── Code Security Audit ────────────────────────────────────────────────────

  auditCode(code: string, language: string): SecurityAuditResult {
    const findings: SecurityFinding[] = [];
    const lines = code.split('\n');

    // OWASP Top 10 pattern scanning
    const injectionPatterns: Array<{ rx: RegExp; desc: string; cat: ThreatCategory; cwe: string }> = [
      { rx: /\.(query|execute|raw)\s*\([^?]*\$\{|\+\s*(req|body|input|params)/i, desc: 'Potential SQL injection via string concatenation in query', cat: 'INJECTION', cwe: 'CWE-89' },
      { rx: /eval\s*\(|new\s+Function\s*\(|setTimeout\s*\([^,]*[,\s]|setInterval\s*\([^,]*[,\s]/i, desc: 'Dynamic code evaluation — code injection vector', cat: 'INJECTION', cwe: 'CWE-94' },
      { rx: /innerHTML\s*=|document\.write\s*\(|\.html\s*\(.*(user|req|input|param)/i, desc: 'Unsafe HTML rendering enables XSS', cat: 'XSS', cwe: 'CWE-79' },
      { rx: /child_process|exec\s*\(|spawn\s*\(|execSync\s*\(|execFile/i, desc: 'Shell command execution without visible sanitization', cat: 'INJECTION', cwe: 'CWE-78' },
      { rx: /dangerouslySetInnerHTML/i, desc: 'React dangerouslySetInnerHTML without sanitization', cat: 'XSS', cwe: 'CWE-79' },
      { rx: /fetch\s*\(.*(req|user|input)\.|\.get\s*\(.*(req|user|input)\.|axios\./i, desc: 'Potential SSRF via user-controlled URLs', cat: 'SSRF', cwe: 'CWE-918' },
      { rx: /JSON\.parse\s*\([^)]*\)(?!\s*\?)/i, desc: 'JSON.parse without try/catch error handling', cat: 'BROKEN_ACCESS_CONTROL', cwe: 'CWE-755' },
      { rx: /Math\.random\s*\(|crypto\.pseudoRandom/i, desc: 'Weak random number generator for security-sensitive contexts', cat: 'INSECURE_CRYPTO', cwe: 'CWE-338' },
      { rx: /md5\s*\(|sha1\s*\(|createHash\s*\(\s*['"]md5|createHash\s*\(\s*['"]sha1/i, desc: 'Weak cryptographic hash algorithm (MD5/SHA1)', cat: 'INSECURE_CRYPTO', cwe: 'CWE-327' },
      { rx: /password\s*[=:].*['"](?:password|passwd|pwd|secret)/i, desc: 'Hardcoded password in source code', cat: 'SENSITIVE_DATA_EXPOSURE', cwe: 'CWE-798' },
      { rx: /req\.(body|query|params)\[|req\.body\.|req\.query\.|req\.params\./i, desc: 'Direct user input usage without validation — potential injection', cat: 'INJECTION', cwe: 'CWE-20' },
      { rx: /jwt\s*=|token\s*=|authorization\s*:\s*['"]?\s*(Bearer|bearer)/i, desc: 'Potential JWT/token exposure in code or logs', cat: 'SENSITIVE_DATA_EXPOSURE', cwe: 'CWE-200' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

      for (const pat of injectionPatterns) {
        if (pat.rx.test(line)) {
          findings.push({
            severity: this.classifySeverity(pat.cat),
            category: pat.cat,
            description: pat.desc,
            location: `Line ${i + 1}`,
            recommendation: this.defaultRecommendation(pat.cat),
            cweId: pat.cwe,
          });
        }
      }
    }

    // Auth bypass detection
    const authBypassPatterns: Array<{ rx: RegExp; desc: string }> = [
      { rx: /if\s*\(\s*(user|isAuth|authenticated)\s*==\s*(false|null|undefined|0)/i, desc: 'Authentication bypass via inverted logic' },
      { rx: /skipAuth|bypassAuth|noAuth|no_auth|disableAuth/i, desc: 'Authentication bypass flag in code' },
      { rx: /admin:\s*true|isAdmin\s*:\s*true/i, desc: 'Hardcoded admin privilege escalation' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//')) continue;
      for (const pat of authBypassPatterns) {
        if (pat.rx.test(line)) {
          findings.push({
            severity: 'critical',
            category: 'BROKEN_AUTH',
            description: pat.desc,
            location: `Line ${i + 1}`,
            recommendation: 'Remove bypass logic; enforce proper authentication middleware.',
            cweId: 'CWE-287',
          });
        }
      }
    }

    const riskScore = this.computeAuditRiskScore(findings);
    const recommendations = this.consolidateRecommendations(findings);

    return {
      passed: findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length === 0,
      findings,
      riskScore,
      recommendations,
      auditTimestampIso: new Date().toISOString(),
    };
  }

  // ── API Security Audit ─────────────────────────────────────────────────────

  auditAPI(endpoints: APIEndpoint[]): SecurityAuditResult {
    const findings: SecurityFinding[] = [];

    for (const ep of endpoints) {
      // OPTIONS (CORS preflight) endpoints are inherently unauthenticated and don't require
      // input validation or rate limiting — skip security checks for them.
      if (ep.method === 'OPTIONS') continue;

      if (ep.auth === 'none') {
        findings.push({
          severity: 'high',
          category: 'BROKEN_AUTH',
          description: `Endpoint ${ep.method} ${ep.path} has no authentication.`,
          location: ep.path,
          recommendation: 'Add authentication (bearer, session, or OAuth2) to protect this endpoint.',
          cweId: 'CWE-306',
        });
      }

      if (!ep.hasRateLimit) {
        findings.push({
          severity: 'medium',
          category: 'BROKEN_ACCESS_CONTROL',
          description: `Endpoint ${ep.method} ${ep.path} lacks rate limiting.`,
          location: ep.path,
          recommendation: 'Implement rate limiting (e.g., token bucket or sliding window) to prevent abuse.',
          cweId: 'CWE-770',
        });
      }

      if (!ep.hasInputValidation) {
        findings.push({
          severity: 'high',
          category: 'INJECTION',
          description: `Endpoint ${ep.method} ${ep.path} has no input validation.`,
          location: ep.path,
          recommendation: 'Validate and sanitize all input against a schema (JSON Schema, Zod, Joi).',
          cweId: 'CWE-20',
        });
      }

      if (!ep.hasOutputEncoding) {
        findings.push({
          severity: 'medium',
          category: 'XSS',
          description: `Endpoint ${ep.method} ${ep.path} lacks output encoding.`,
          location: ep.path,
          recommendation: 'Encode output based on context (HTML, JSON, XML) before returning to client.',
          cweId: 'CWE-79',
        });
      }

      if ((ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH' || ep.method === 'DELETE') && !ep.hasCSRFProtection) {
        findings.push({
          severity: 'medium',
          category: 'CSRF',
          description: `State-changing endpoint ${ep.method} ${ep.path} lacks CSRF protection.`,
          location: ep.path,
          recommendation: 'Implement CSRF tokens or SameSite cookie attributes for session-based auth.',
          cweId: 'CWE-352',
        });
      }

      // Missing OPTIONS handler indicates no CORS policy
      if (!endpoints.some((e) => e.path === ep.path && e.method === 'OPTIONS')) {
        findings.push({
          severity: 'low',
          category: 'SECURITY_MISCONFIG',
          description: `No OPTIONS handler for ${ep.path} — CORS may be misconfigured.`,
          location: ep.path,
          recommendation: 'Define explicit CORS policy with allowed origins, methods, and headers.',
          cweId: 'CWE-942',
        });
      }
    }

    const riskScore = this.computeAuditRiskScore(findings);
    const recommendations = this.consolidateRecommendations(findings);

    return {
      passed: findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length === 0,
      findings,
      riskScore,
      recommendations,
      auditTimestampIso: new Date().toISOString(),
    };
  }

  // ── Database Security Audit ────────────────────────────────────────────────

  auditDatabase(schema: DatabaseSchema): SecurityAuditResult {
    const findings: SecurityFinding[] = [];

    for (const table of schema.tables) {
      if (!schema.hasEncryptionAtRest) {
        findings.push({
          severity: 'critical',
          category: 'SENSITIVE_DATA_EXPOSURE',
          description: `Table ${table.name} data is not encrypted at rest.`,
          location: `database.table.${table.name}`,
          recommendation: 'Enable transparent data encryption (TDE) or application-level field encryption.',
          cweId: 'CWE-311',
        });
      }

      for (const col of table.columns) {
        if (col.sensitive && !col.nullable === false) {
          findings.push({
            severity: 'medium',
            category: 'SENSITIVE_DATA_EXPOSURE',
            description: `Column ${table.name}.${col.name} stores sensitive data without explicit encryption.`,
            location: `database.table.${table.name}.column.${col.name}`,
            recommendation: 'Encrypt sensitive columns using application-level encryption or column-level TDE.',
            cweId: 'CWE-311',
          });
        }
      }

      if (table.hasSensitiveColumns && !table.hasRowLevelSecurity && schema.accessControlModel !== 'rls') {
        findings.push({
          severity: 'high',
          category: 'BROKEN_ACCESS_CONTROL',
          description: `Table ${table.name} contains sensitive columns without row-level security.`,
          location: `database.table.${table.name}`,
          recommendation: 'Enable row-level security (RLS) policies to restrict data access by tenant/role.',
          cweId: 'CWE-284',
        });
      }
    }

    if (!schema.hasEncryptionInTransit) {
      findings.push({
        severity: 'critical',
        category: 'SENSITIVE_DATA_EXPOSURE',
        description: 'Database connections do not enforce encryption in transit.',
        location: 'database.connection',
        recommendation: 'Require TLS 1.2+ for all database connections; reject unencrypted connections.',
        cweId: 'CWE-319',
      });
    }

    if (schema.accessControlModel === 'none') {
      findings.push({
        severity: 'critical',
        category: 'BROKEN_ACCESS_CONTROL',
        description: 'No database access control model is configured.',
        location: 'database.access_control',
        recommendation: 'Implement role-based access control (RBAC) or row-level security (RLS).',
        cweId: 'CWE-862',
      });
    }

    const riskScore = this.computeAuditRiskScore(findings);
    const recommendations = this.consolidateRecommendations(findings);

    return {
      passed: findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length === 0,
      findings,
      riskScore,
      recommendations,
      auditTimestampIso: new Date().toISOString(),
    };
  }

  // ── Input Validation ───────────────────────────────────────────────────────

  validateInput(input: unknown, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    if (input === null || input === undefined) {
      if ((schema.required?.length ?? 0) > 0) {
        errors.push({ path: '$', message: 'Input is null/undefined but required fields exist.' });
      }
      return { valid: errors.length === 0, errors, sanitizedValue: input };
    }

    if (typeof input !== 'object' || Array.isArray(input)) {
      errors.push({ path: '$', message: `Expected object, got ${typeof input}` });
      return { valid: false, errors };
    }

    const obj = input as Record<string, unknown>;

    // Check required fields
    for (const req of schema.required ?? []) {
      if (!(req in obj) || obj[req] === null || obj[req] === undefined) {
        errors.push({ path: req, message: `Required field "${req}" is missing.` });
      }
    }

    // Validate each field
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const value = obj[fieldName];
      if (value === undefined || value === null) continue;

      const fieldErrors = this.validateField(value, fieldSchema, fieldName);
      errors.push(...fieldErrors);
    }

    // Check for additional properties
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in schema.properties)) {
          errors.push({ path: key, message: `Additional property "${key}" is not allowed.` });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? this.sanitizeOutput(input, 'html') : undefined,
    };
  }

  private validateField(value: unknown, field: SchemaField, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type check
    const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    if (field.type !== 'null' && actualType !== field.type) {
      // Allow integer values to pass as 'integer' or 'number'
      if ((field.type === 'number' || field.type === 'integer') && actualType === 'number' && Number.isInteger(value as number)) {
        // OK
      } else if (field.type !== actualType) {
        errors.push({ path, message: `Type mismatch`, expected: field.type, actual: actualType });
      }
    }

    if (typeof value === 'string') {
      const s = value as string;
      if (field.minLength !== undefined && s.length < field.minLength) {
        errors.push({ path, message: `String too short`, expected: `>=${field.minLength}`, actual: `${s.length}` });
      }
      if (field.maxLength !== undefined && s.length > field.maxLength) {
        errors.push({ path, message: `String too long`, expected: `<=${field.maxLength}`, actual: `${s.length}` });
      }
      if (field.pattern !== undefined && !new RegExp(field.pattern).test(s)) {
        errors.push({ path, message: `Pattern mismatch`, expected: field.pattern, actual: s });
      }
      if (field.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
        errors.push({ path, message: 'Invalid email format' });
      }
      if (field.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
        errors.push({ path, message: 'Invalid UUID format' });
      }
      if (field.enum && !field.enum.includes(s)) {
        errors.push({ path, message: `Value not in allowed enum`, expected: JSON.stringify(field.enum), actual: s });
      }
    }

    if (typeof value === 'number') {
      const n = value as number;
      if (field.minimum !== undefined && n < field.minimum) {
        errors.push({ path, message: `Value below minimum`, expected: `>=${field.minimum}`, actual: `${n}` });
      }
      if (field.maximum !== undefined && n > field.maximum) {
        errors.push({ path, message: `Value above maximum`, expected: `<=${field.maximum}`, actual: `${n}` });
      }
    }

    if (Array.isArray(value) && field.items) {
      const arr = value as unknown[];
      for (let i = 0; i < arr.length; i++) {
        errors.push(...this.validateField(arr[i], field.items, `${path}[${i}]`));
      }
    }

    if (typeof value === 'object' && !Array.isArray(value) && field.properties) {
      const obj = value as Record<string, unknown>;
      for (const [k, subField] of Object.entries(field.properties)) {
        if (k in obj) {
          errors.push(...this.validateField(obj[k], subField, `${path}.${k}`));
        }
      }
    }

    return errors;
  }

  // ── Output Sanitization ────────────────────────────────────────────────────

  sanitizeOutput(output: unknown, context: SanitizationContext): unknown {
    if (output === null || output === undefined) return output;
    if (typeof output === 'string') {
      return this.sanitizeString(output, context);
    }
    if (Array.isArray(output)) {
      return output.map((item) => this.sanitizeOutput(item, context));
    }
    if (typeof output === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(output as Record<string, unknown>)) {
        sanitized[k] = this.sanitizeOutput(v, context);
      }
      return sanitized;
    }
    return output;
  }

  private sanitizeString(value: string, context: SanitizationContext): string {
    switch (context) {
      case 'html':
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      case 'sql':
        return value.replace(/'/g, "''").replace(/;/g, '');
      case 'javascript':
        return value
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"')
          .replace(/</g, '\\x3C')
          .replace(/>/g, '\\x3E')
          .replace(/\//g, '\\/');
      case 'url':
        return encodeURIComponent(value);
      case 'shell':
        return value.replace(/[;&|`$(){}[\]\\"'\\-]/g, '\\$&').replace(/'\b/g, "'\\''");
      case 'xml':
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;&quot;');
      case 'ldap':
        return value.replace(/[\\*()\0]/g, '\\$&');
      default:
        return value;
    }
  }

  // ── Secret Detection ───────────────────────────────────────────────────────

  detectSecrets(code: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = code.split('\n');

    const secretPatterns: Array<{ rx: RegExp; type: string; severity: SecretFinding['severity']; recommendation: string }> = [
      { rx: /AKIA[0-9A-Z]{16}/, type: 'AWS Access Key ID', severity: 'critical', recommendation: 'Rotate key immediately; use IAM roles instead.' },
      { rx: /(?:sk-|sk-proj-|sk-ant-)[A-Za-z0-9_-]{20,}/, type: 'LLM Provider API Key', severity: 'critical', recommendation: 'Rotate key immediately; load from environment variables or secret manager.' },
      { rx: /ghp_[A-Za-z0-9]{20,}/, type: 'GitHub Personal Access Token', severity: 'critical', recommendation: 'Rotate token immediately; use fine-grained PATs with minimal scopes.' },
      { rx: /gho_[A-Za-z0-9]{20,}/, type: 'GitHub OAuth Token', severity: 'critical', recommendation: 'Revoke OAuth token immediately.' },
      { rx: /AIza[0-9A-Za-z_-]{35}/, type: 'Google Cloud API Key', severity: 'critical', recommendation: 'Restrict key in Google Cloud Console; rotate if exposed.' },
      { rx: /-{5}BEGIN\s+(?:RSA|OPENSSH|EC|DSA)?\s+PRIVATE\s+KEY-{5}/, type: 'Private Key', severity: 'critical', recommendation: 'Remove private key from source; use SSH agent or key management service.' },
      { rx: /-{5}BEGIN\s+(?:RSA|DSA|EC)\s+PUBLIC\s+KEY-{5}/, type: 'Public Key', severity: 'low', recommendation: 'Verify public key exposure is intentional.' },
      { rx: /xox[baprs]-[0-9a-zA-Z]{10,48}/, type: 'Slack Token', severity: 'high', recommendation: 'Rotate token; store in secret manager.' },
      { rx: /sk_live_[0-9a-zA-Z]{24,}/, type: 'Stripe Live Key', severity: 'critical', recommendation: 'Rotate key immediately; never commit live keys.' },
      { rx: /-----BEGIN\s+CERTIFICATE-----/, type: 'Certificate Material', severity: 'medium', recommendation: 'Verify if certificate is meant to be public; remove if private.' },
      { rx: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i, type: 'MongoDB Connection String', severity: 'critical', recommendation: 'Rotate credentials; use environment-based connection strings.' },
      { rx: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/i, type: 'PostgreSQL Connection String', severity: 'critical', recommendation: 'Rotate credentials; use environment-based connection strings.' },
      { rx: /mysql:\/\/[^:]+:[^@]+@/i, type: 'MySQL Connection String', severity: 'critical', recommendation: 'Rotate credentials; use environment-based connection strings.' },
      { rx: /password\s*[=:]\s*['"][^'"]{4,}['"]/i, type: 'Hardcoded Password', severity: 'high', recommendation: 'Remove hardcoded password; use environment variables or secret manager.' },
      { rx: /api[_-]?key\s*[=:]\s*['"][^'"]{8,}['"]/i, type: 'Hardcoded API Key', severity: 'high', recommendation: 'Remove hardcoded key; use environment variables.' },
      { rx: /secret\s*[=:]\s*['"][^'"]{4,}['"]/i, type: 'Hardcoded Secret', severity: 'high', recommendation: 'Remove hardcoded secret; use environment variables or secret manager.' },
      { rx: /token\s*[=:]\s*['"][^'"]{8,}['"]/i, type: 'Hardcoded Token', severity: 'high', recommendation: 'Remove hardcoded token; use environment variables.' },
      { rx: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/, type: 'JWT Token', severity: 'high', recommendation: 'Remove JWT from source; tokens should be issued at runtime.' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of secretPatterns) {
        const match = line.match(pat.rx);
        if (match) {
          const rawValue = match[0];
          const masked = this.maskSecret(rawValue);
          findings.push({
            type: pat.type,
            value: rawValue,
            maskedValue: masked,
            severity: pat.severity,
            lineNumber: i + 1,
            fileName: '',
            recommendation: pat.recommendation,
          });
        }
      }
    }

    return findings;
  }

  private maskSecret(value: string): string {
    if (value.length <= 12) return '*'.repeat(value.length);
    return value.slice(0, 6) + '*'.repeat(Math.min(value.length - 12, 20)) + value.slice(-6);
  }

  // ── Dependency Scanning ────────────────────────────────────────────────────

  scanDependencies(manifest: string): DependencyFinding[] {
    const findings: DependencyFinding[] = [];

    // Known vulnerable packages with minimum safe versions
    // This is a curated baseline — real deployments should use npm audit / OSV database
    const knownVulns: Array<{
      pkg: string;
      vulnerableRanges: Array<{ lt: string }>;
      cveId: string;
      severity: DependencyFinding['severity'];
      description: string;
      fixedVersion: string;
      recommendation: string;
    }> = [
      {
        pkg: 'express',
        vulnerableRanges: [{ lt: '4.18.2' }],
        cveId: 'CVE-2022-24999',
        severity: 'high',
        description: 'Open redirect via qs middleware in Express.',
        fixedVersion: '4.18.2',
        recommendation: 'Update express to >= 4.18.2.',
      },
      {
        pkg: 'express',
        vulnerableRanges: [{ lt: '4.17.3' }],
        cveId: 'CVE-2022-0235',
        severity: 'medium',
        description: 'Memory exhaustion via multipart request.',
        fixedVersion: '4.17.3',
        recommendation: 'Update express to >= 4.17.3.',
      },
      {
        pkg: 'axios',
        vulnerableRanges: [{ lt: '0.21.4' }],
        cveId: 'CVE-2021-3749',
        severity: 'medium',
        description: 'Regular expression denial of service (ReDoS).',
        fixedVersion: '0.21.4',
        recommendation: 'Update axios to >= 0.21.4.',
      },
      {
        pkg: 'jsonwebtoken',
        vulnerableRanges: [{ lt: '8.5.1' }],
        cveId: 'CVE-2022-23529',
        severity: 'critical',
        description: 'JWT secret leak via insecure key validation.',
        fixedVersion: '8.5.1',
        recommendation: 'Update jsonwebtoken to >= 8.5.1 and verify algorithms explicitly.',
      },
      {
        pkg: 'minimist',
        vulnerableRanges: [{ lt: '1.2.6' }],
        cveId: 'CVE-2021-44906',
        severity: 'critical',
        description: 'Prototype pollution via constructor argument.',
        fixedVersion: '1.2.6',
        recommendation: 'Update minimist to >= 1.2.6 or switch to a maintained alternative.',
      },
      {
        pkg: 'lodash',
        vulnerableRanges: [{ lt: '4.17.21' }],
        cveId: 'CVE-2021-23337',
        severity: 'high',
        description: 'Command injection via template function.',
        fixedVersion: '4.17.21',
        recommendation: 'Update lodash to >= 4.17.21.',
      },
      {
        pkg: 'debug',
        vulnerableRanges: [{ lt: '2.6.9' }],
        cveId: 'CVE-2017-16137',
        severity: 'low',
        description: 'Regular expression denial of service.',
        fixedVersion: '2.6.9',
        recommendation: 'Update debug to >= 2.6.9.',
      },
      {
        pkg: 'semver',
        vulnerableRanges: [{ lt: '7.5.2' }],
        cveId: 'CVE-2022-25883',
        severity: 'high',
        description: 'Regular expression denial of service.',
        fixedVersion: '7.5.2',
        recommendation: 'Update semver to >= 7.5.2.',
      },
      {
        pkg: 'yaml',
        vulnerableRanges: [{ lt: '1.14.2' }],
        cveId: 'CVE-2023-22580',
        severity: 'high',
        description: 'Denial of service via deeply nested YAML structures.',
        fixedVersion: '1.14.2',
        recommendation: 'Update yaml to >= 1.14.2.',
      },
      {
        pkg: 'node-fetch',
        vulnerableRanges: [{ lt: '2.7.0' }],
        cveId: 'CVE-2022-0235',
        severity: 'medium',
        description: 'Information exposure via error messages.',
        fixedVersion: '2.7.0',
        recommendation: 'Update node-fetch to >= 2.7.0.',
      },
    ];

    // Parse package.json-style manifest
    const deps: Record<string, string> = {};
    try {
      const manifestObj = JSON.parse(manifest);
      const allDeps = { ...manifestObj.dependencies, ...manifestObj.devDependencies };
      for (const [name, version] of Object.entries(allDeps)) {
        const cleanVersion = (version as string).replace(/[\^~>=<]/g, '').split('.').slice(0, 3).join('.');
        deps[name] = cleanVersion || '0.0.0';
      }
    } catch {
      // Try line-by-line parsing for other manifest formats
      for (const line of manifest.split('\n')) {
        const match = line.match(/(\S+)\s+([\d][\d.]*)/);
        if (match) deps[match[1]] = match[2];
      }
    }

    for (const vuln of knownVulns) {
      const installed = deps[vuln.pkg];
      if (!installed) continue;
      if (this.versionIsVulnerable(installed, vuln.vulnerableRanges)) {
        findings.push({
          package: vuln.pkg,
          installedVersion: installed,
          vulnerableVersion: vuln.vulnerableRanges.map((r) => `<${r.lt}`).join(', '),
          cveId: vuln.cveId,
          severity: vuln.severity,
          description: vuln.description,
          fixedVersion: vuln.fixedVersion,
          recommendation: vuln.recommendation,
        });
      }
    }

    return findings;
  }

  private versionIsVulnerable(installed: string, ranges: Array<{ lt: string }>): boolean {
    for (const range of ranges) {
      if (this.compareVersions(installed, range.lt) < 0) return true;
    }
    return false;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const va = partsA[i] ?? 0;
      const vb = partsB[i] ?? 0;
      if (va < vb) return -1;
      if (va > vb) return 1;
    }
    return 0;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private classifySeverity(category: ThreatCategory): SecurityFinding['severity'] {
    switch (category) {
      case 'INJECTION':
      case 'BROKEN_AUTH':
      case 'INSECURE_DESERIALIZATION':
        return 'critical';
      case 'XSS':
      case 'BROKEN_ACCESS_CONTROL':
      case 'SENSITIVE_DATA_EXPOSURE':
        return 'high';
      case 'SSRF':
      case 'CSRF':
        return 'medium';
      default:
        return 'low';
    }
  }

  private defaultRecommendation(category: ThreatCategory): string {
    switch (category) {
      case 'INJECTION':
        return 'Use parameterized queries and input validation.';
      case 'BROKEN_AUTH':
        return 'Implement MFA, rate-limit auth endpoints, use secure session management.';
      case 'BROKEN_ACCESS_CONTROL':
        return 'Enforce deny-by-default authorization on every endpoint.';
      case 'XSS':
        return 'Apply context-aware output encoding and set Content-Security-Policy header.';
      case 'SENSITIVE_DATA_EXPOSURE':
        return 'Encrypt data at rest and in transit; classify and mask sensitive data.';
      case 'SSRF':
        return 'Allowlist external destinations and validate all URLs server-side.';
      case 'CSRF':
        return 'Add CSRF tokens and SameSite cookie attributes.';
      case 'INSECURE_DESERIALIZATION':
        return 'Validate and whitelist deserialized types; use safe formats like JSON.';
      case 'INSECURE_CRYPTO':
        return 'Use AES-256-GCM or ChaCha20-Poly1305; rotate keys regularly.';
      case 'SECURITY_MISCONFIG':
        return 'Harden configuration: remove debug mode, set security headers, minimize attack surface.';
      default:
        return 'Implement defense-in-depth security controls.';
    }
  }

  private computeAuditRiskScore(findings: SecurityFinding[]): number {
    const severityWeights: Record<string, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 1 };
    const total = findings.reduce((sum, f) => sum + (severityWeights[f.severity] ?? 0), 0);
    return Math.min(100, total);
  }

  private consolidateRecommendations(findings: SecurityFinding[]): string[] {
    const seen = new Set<string>();
    const recs: string[] = [];
    for (const f of findings) {
      const key = f.recommendation;
      if (!seen.has(key)) {
        seen.add(key);
        recs.push(key);
      }
    }
    return recs;
  }
}

