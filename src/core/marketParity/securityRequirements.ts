/**
 * AETHER Market-Parity Engine — Security Requirements Generator
 *
 * Generates comprehensive security requirements mapped to compliance
 * frameworks: SOC 2 Type II, ISO 27001, HIPAA (healthcare), PCI-DSS (payments).
 */

import type { SecurityRequirement } from './types';

export function generateSecurityRequirements(): SecurityRequirement[] {
  return [
    // ─── Authentication & Session Security ───────────────────────────────────
    {
      id: 'SEC-AUTH-01',
      category: 'Authentication',
      requirement: 'FIDO2/WebAuthn passkey support for passwordless authentication',
      implementation: 'Register navigator.credentials.create() for passkey enrollment and navigator.credentials.get() for assertion. Store credential_id (BYTEA PK), public_key_cose, sign_count with clone detection. Fallback to Argon2id password hashing.',
      compliance: ['SOC 2 CC6.1', 'NIST 800-63B'],
    },
    {
      id: 'SEC-AUTH-02',
      category: 'Authentication',
      requirement: 'OAuth 2.0/OIDC federation with PKCE for social and enterprise login',
      implementation: 'Authorization code flow with S256 PKCE challenge. Support Google, Apple (Sign in with Apple), GitHub, Microsoft, and SAML 2.0 enterprise IdPs. State parameter validation to prevent CSRF.',
      compliance: ['SOC 2 CC6.1', 'OAuth 2.1', 'OIDC Core 1.0'],
    },
    {
      id: 'SEC-AUTH-03',
      category: 'Authentication',
      requirement: 'Adaptive MFA with TOTP, SMS/Voice fallback, and step-up authentication',
      implementation: 'RFC 6238 TOTP authenticator with QR provisioning. 10 single-use Argon2id-hashed recovery codes. SMS/Voice OTP fallback. Risk-triggered step-up MFA for payout changes, data export, high-value transactions.',
      compliance: ['SOC 2 CC6.2', 'NIST 800-63B AAL2'],
    },
    {
      id: 'SEC-AUTH-04',
      category: 'Session Management',
      requirement: 'Dual-token rotation with refresh token family and reuse detection',
      implementation: 'Short-lived JWT access tokens (RS256, 5-15min) + opaque refresh tokens in HttpOnly/Secure/SameSite=Strict cookies. Token family tracking: rotated token replay invalidates entire family, terminates all sessions, dispatches security alert.',
      compliance: ['SOC 2 CC6.3', 'OWASP ASVS 3.5.1'],
    },
    {
      id: 'SEC-AUTH-05',
      category: 'Session Management',
      requirement: 'Active device & session management portal with GeoIP',
      implementation: 'Parse User-Agent (browser, OS, device model), resolve IP to GeoIP city/country. Display all active sessions with one-click "Revoke Session" and "Sign Out All Other Devices". Session revocation invalidates all associated tokens.',
      compliance: ['SOC 2 CC6.3', 'GDPR Art. 17'],
    },

    // ─── Authorization & Access Control ──────────────────────────────────────
    {
      id: 'SEC-RBAC-01',
      category: 'Authorization',
      requirement: 'Hierarchical RBAC with domain:resource:action:scope permission grammar',
      implementation: 'Resource-Action-Scope permission matrix (e.g., catalog:product:publish:store_id). Role hierarchy with inheritance. Maker-checker (four-eyes) for high-risk mutations (refunds above threshold, bulk price overrides >30%, payout account changes).',
      compliance: ['SOC 2 CC6.3', 'ISO 27001 A.9'],
    },
    {
      id: 'SEC-RBAC-02',
      category: 'Authorization',
      requirement: 'Break-glass audited impersonation with time-boxed sessions',
      implementation: 'Support engineers initiate 15-minute time-boxed read-only or action-scoped shadow sessions. Mandatory ticket reference ID. Persistent banner during impersonation. Immutable audit trail recording impersonator, target, and all actions.',
      compliance: ['SOC 2 CC6.3', 'HIPAA §164.308', 'ISO 27001 A.9'],
    },
    {
      id: 'SEC-RBAC-03',
      category: 'Data Isolation',
      requirement: 'PostgreSQL Row-Level Security for multi-tenant data isolation',
      implementation: 'Every tenant-scoped table has RLS policy: USING (tenant_id = current_setting(\'app.current_tenant_id\')::uuid). Application sets tenant context at connection start. Zero cross-tenant data leakage even with application bugs.',
      compliance: ['SOC 2 CC6.1', 'ISO 27001 A.13', 'PCI-DSS Req. 7'],
    },

    // ─── Input Validation & Injection Prevention ─────────────────────────────
    {
      id: 'SEC-INPUT-01',
      category: 'Input Validation',
      requirement: 'Strict schema validation with additionalProperties: false',
      implementation: 'All ingress payloads validated against Zod/TypeBox schemas rejecting unknown fields. String length bounds enforced. HTML/Markdown inputs sanitized against Stored XSS using DOMPurify. SQL uses parameterized queries exclusively.',
      compliance: ['OWASP ASVS 5.1', 'CWE-20', 'CWE-79'],
    },
    {
      id: 'SEC-INPUT-02',
      category: 'Input Validation',
      requirement: 'CSRF protection with double-submit cookie pattern',
      implementation: 'All state-changing requests require X-CSRF-Token header matching server-issued cookie. SameSite=Strict cookies for session tokens. Origin/Referer header validation for sensitive endpoints.',
      compliance: ['OWASP ASVS 5.2', 'CWE-352'],
    },

    // ─── Cryptography & Data Protection ──────────────────────────────────────
    {
      id: 'SEC-CRYPTO-01',
      category: 'Cryptography',
      requirement: 'Field-level envelope encryption for sensitive PII',
      implementation: 'Sensitive PII (tax IDs, national identifiers, OAuth secrets, clinical notes) encrypted at application layer using AES-256-GCM. Per-tenant Data Encryption Keys (DEKs) wrapped by KMS Master Key. Blind-index HMAC-SHA256 for exact-match lookups.',
      compliance: ['SOC 2 CC6.1', 'ISO 27001 A.10', 'HIPAA §164.312', 'PCI-DSS Req. 3'],
    },
    {
      id: 'SEC-CRYPTO-02',
      category: 'Cryptography',
      requirement: 'Webhook signature verification with HMAC-SHA256',
      implementation: 'All inbound webhooks (payment gateways, logistics carriers, AI providers) verified using raw request body HMAC-SHA256 signatures. Timestamp tolerance <= 300 seconds to prevent replay attacks. Processed event_ids stored in idempotency table.',
      compliance: ['SOC 2 CC6.6', 'OWASP ASVS 9.2'],
    },
    {
      id: 'SEC-CRYPTO-03',
      category: 'Cryptography',
      requirement: 'TLS 1.3 enforcement and HSTS preload',
      implementation: 'TLS 1.3 minimum version. HSTS header with max-age=31536000, includeSubDomains, preload. Certificate transparency monitoring. Automated certificate renewal via Let\'s Encrypt / ACM.',
      compliance: ['PCI-DSS Req. 4.1', 'SOC 2 CC6.7'],
    },

    // ─── API Security ────────────────────────────────────────────────────────
    {
      id: 'SEC-API-01',
      category: 'API Security',
      requirement: 'Token-bucket and sliding-window rate limiting',
      implementation: 'Multi-tiered rate limiting keyed by IP address, authenticated user_id, API key, and route sensitivity. Auth routes: 5 req/min. Search routes: 120 req/min. Checkout routes: 5 req/min. Returns RFC 6585 429 with Retry-After and X-RateLimit-* headers.',
      compliance: ['OWASP ASVS 4.1', 'CWE-307'],
    },
    {
      id: 'SEC-API-02',
      category: 'API Security',
      requirement: 'CORS strict allowlist and credential-aware origins',
      implementation: 'Strict CORS allowlist per environment. Credentials (cookies) only for whitelisted origins. No wildcard (*) with credentials. Preflight caching (Access-Control-Max-Age: 86400). Vary: Origin header.',
      compliance: ['OWASP ASVS 6.2', 'CWE-942'],
    },
    {
      id: 'SEC-API-03',
      category: 'API Security',
      requirement: 'Security headers: CSP, HSTS, X-Content-Type-Options, Permissions-Policy',
      implementation: 'Strict-Transport-Security (HSTS preload). Nonce-based Content-Security-Policy (no unsafe-inline for scripts). X-Content-Type-Options: nosniff. Permissions-Policy disabling camera/microphone/geolocation. X-Frame-Options: DENY.',
      compliance: ['OWASP ASVS 5.3', 'CWE-693', 'SOC 2 CC6.6'],
    },

    // ─── Audit & Compliance ──────────────────────────────────────────────────
    {
      id: 'SEC-AUDIT-01',
      category: 'Audit',
      requirement: 'Immutable hash-chained append-only audit log',
      implementation: 'Every create/update/delete/permission-change/login/export/impersonation writes to audit_logs. prev_hash chains records: SHA-256(prev_hash || payload). PostgreSQL BEFORE UPDATE OR DELETE trigger unconditionally raises exception. W3C Trace Context request_id propagation.',
      compliance: ['SOC 2 CC7.2', 'ISO 27001 A.12', 'HIPAA §164.312', 'PCI-DSS Req. 10'],
    },
    {
      id: 'SEC-AUDIT-02',
      category: 'Audit',
      requirement: 'Sensitive data redaction in audit log state snapshots',
      implementation: 'before_state and after_state JSONB have sensitive PII redacted before storage (passwords, MFA secrets, full card numbers, SSN). Redaction rules enforced at application layer before INSERT.',
      compliance: ['GDPR Art. 5', 'HIPAA §164.502', 'PCI-DSS Req. 3.4'],
    },

    // ─── Infrastructure Security ─────────────────────────────────────────────
    {
      id: 'SEC-INFRA-01',
      category: 'Infrastructure',
      requirement: 'Secrets management — no secrets in code or environment files',
      implementation: 'All secrets (API keys, database passwords, encryption keys) stored in HashiCorp Vault or AWS Secrets Manager. Application retrieves secrets at runtime via IAM-authenticated API. No .env files in version control. Pre-commit hooks scan for leaked secrets.',
      compliance: ['SOC 2 CC6.1', 'ISO 27001 A.9', 'PCI-DSS Req. 3'],
    },
    {
      id: 'SEC-INFRA-02',
      category: 'Infrastructure',
      requirement: 'Dependency vulnerability scanning and automated patching',
      implementation: 'npm audit / Snyk / Dependabot for automated vulnerability scanning. CI pipeline blocks builds with HIGH/CRITICAL vulnerabilities. Monthly dependency review. Software Bill of Materials (SBOM) generation.',
      compliance: ['SOC 2 CC7.1', 'ISO 27001 A.12'],
    },
    {
      id: 'SEC-INFRA-03',
      category: 'Infrastructure',
      requirement: 'Database connection encryption and least-privilege credentials',
      implementation: 'PostgreSQL connections via SSL/TLS (sslmode=require). Separate database users per service with minimum required privileges. Application user cannot DDL/CREATE EXTENSION. Read replicas use read-only users.',
      compliance: ['PCI-DSS Req. 4.1', 'SOC 2 CC6.1'],
    },
    {
      id: 'SEC-INFRA-04',
      category: 'Infrastructure',
      requirement: 'Automated backup encryption and disaster recovery testing',
      implementation: 'Daily encrypted PostgreSQL backups (AES-256). Point-in-time recovery (PAG) for 30 days. Quarterly disaster recovery drills with RTO < 4 hours, RPO < 15 minutes. Backup integrity verification.',
      compliance: ['SOC 2 A1.3', 'ISO 27001 A.17'],
    },

    // ─── AI Safety & Governance ──────────────────────────────────────────────
    {
      id: 'SEC-AI-01',
      category: 'AI Safety',
      requirement: 'Prompt injection classification and PII redaction before external LLM calls',
      implementation: 'Classify all user inputs for prompt injection patterns before sending to external LLMs. Redact PII (emails, phone numbers, addresses) from prompts using regex + NER. Structured output enforcement via JSON Schema.',
      compliance: ['OWASP Top 10 for LLMs 2025', 'NIST AI RMF'],
    },
    {
      id: 'SEC-AI-02',
      category: 'AI Safety',
      requirement: 'Per-tenant token budget metering and spend caps',
      implementation: 'Track per-tenant and per-user token usage. Configurable daily/monthly token budgets. Hard stop when budget exceeded. Semantic response caching to reduce duplicate LLM calls. Cost estimation before API call.',
      compliance: ['SOC 2 CC6.1', 'FinOps'],
    },

    // ─── Privacy & Data Protection ───────────────────────────────────────────
    {
      id: 'SEC-PRIV-01',
      category: 'Privacy',
      requirement: 'GDPR/DPDP/CCPA data export and right to erasure',
      implementation: 'POST /account/data-export generates encrypted archive of profile, orders, reviews, and audit events. Soft-delete account with 14-day grace window. After grace: cryptographic PII anonymization (email → anonymized_uuid@deleted.local, name → "Deleted User").',
      compliance: ['GDPR Art. 17', 'DPDP Act', 'CCPA §1798.105'],
    },
    {
      id: 'SEC-PRIV-02',
      category: 'Privacy',
      requirement: 'Cookie consent management and data minimization',
      implementation: 'GDPR-compliant cookie consent banner with granular controls (essential/analytics/marketing). No marketing cookies set before consent. Data minimization: only collect fields required for stated purpose. Retention policies enforced per data category.',
      compliance: ['GDPR Art. 5', 'ePrivacy Directive', 'CCPA'],
    },
  ];
}
