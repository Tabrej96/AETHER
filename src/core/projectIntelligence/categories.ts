/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P12 · PROJECT CATEGORIES
 * (src/core/projectIntelligence/categories.ts) · Created by Tabrej
 *
 * Each category is a *strategy profile*: the architecture hint, the design
 * language, the data-model emphasis, the security posture, the UX patterns,
 * and the testing emphasis that category genuinely requires. "A simple
 * portfolio should not receive enterprise architecture complexity; a
 * financial application should not receive a casual security strategy."
 */

export type ProjectCategory =
  | 'SAAS'
  | 'ERP'
  | 'CRM'
  | 'PROJECT_MANAGEMENT'
  | 'ECOMMERCE'
  | 'MARKETPLACE'
  | 'CAD_3D'
  | 'STREAMING_MEDIA'
  | 'SOCIAL_COMMUNITY'
  | 'DEVTOOLS'
  | 'AI_APPLICATION'
  | 'DESKTOP_APP'
  | 'MOBILE_APP'
  | 'GAME'
  | 'FINANCIAL'
  | 'BOOKING'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'INTERNAL_BUSINESS'
  | 'REAL_ESTATE'
  | 'TRAVEL_HOSPITALITY'
  | 'LOGISTICS'
  | 'JOBS_RECRUITMENT'
  | 'MANUFACTURING'
  | 'CREATOR_DIGITAL'
  | 'API_INFRASTRUCTURE'
  | 'DATA_INTENSIVE'
  | 'UNSEEN'; // first-principles: none of the known categories fit

export interface CategoryProfile {
  id: ProjectCategory;
  label: string;
  /** what makes this category what it is (the classification evidence) */
  keywords: RegExp;
  /** the architecture P11 should be steered toward (a hint, never forced) */
  architectureHint: string;
  /** the design language the category genuinely benefits from */
  designLanguage: string;
  /** the data-model emphasis (entities + integrity hotspots) */
  dataModel: string;
  /** the security posture — a financial app does NOT get a casual one */
  securityPosture: 'STANDARD' | 'HARDENED' | 'FINANCIAL' | 'HEALTH' | 'DATA_RESIDENT';
  /** UX patterns that matter for this category */
  uxPatterns: string[];
  /** the test emphasis (beyond the proportional P10 gate) */
  testingEmphasis: string[];
  /** the category's distinctive edge domains (where the hard cases live) */
  edgeDomains: string[];
}

export const CATEGORIES: CategoryProfile[] = [
  {
    id: 'FINANCIAL',
    label: 'Financial / billing / accounting',
    keywords: /(?:payment|billing|ledger|accounting|loan|\bEMI\b|credit|refund|settlement|invoice|treasury|reconcil)/i,
    architectureHint: 'modular-micro or event-driven around a double-entry core; money is an outbox + saga, never ad-hoc',
    designLanguage: 'information-dense financial grids, tabular numerals, precise status indicators — clarity over decoration',
    dataModel: 'double-entry ledger (immutable), currency as integer paise, proration + settlement tables, audit on every mutation',
    securityPosture: 'FINANCIAL',
    uxPatterns: ['exact figures with currency precision', 'audit trails visible to the user', 'irreversible actions get explicit confirmation', 'empty/reconciliation states first-class'],
    testingEmphasis: ['property tests on money invariants (sum of debits = sum of credits)', 'idempotency of every payment op', 'race: double-charge on retry', 'regression on known invoice values'],
    edgeDomains: ['payment succeeded but response timed out', 'subscription expires mid-transaction', 'double refund', 'proration on plan change', 'cross-currency FX at charge time'],
  },
  {
    id: 'HEALTHCARE',
    label: 'Healthcare administration',
    keywords: /(?:patient|clinical|appointment|medical|diagnosis|EMR|HIPAA|prescription|treatment)/i,
    architectureHint: 'modular monolith with strict audit + access logging; avoid hot microservices until scale proves itself',
    designLanguage: 'calm, high-trust, high-legibility; zero playful motion; clinical status colors with meaning',
    dataModel: 'patient identity + consent graph, immutable clinical records, retention + privacy-request lifecycle',
    securityPosture: 'HEALTH',
    uxPatterns: ['read-only confirmations for clinical values', 'consent visible at point of use', 'print/export fidelity'],
    testingEmphasis: ['consent-boundary tests', 'audit-completeness (no mutation without a log row)', 'retention/erasure workflows'],
    edgeDomains: ['patient record access after consent revocation', 'two clinics, one patient', 'record correction vs amendment (never overwrite)'],
  },
  {
    id: 'CAD_3D',
    label: 'Jewellery / CAD / 3D configurator',
    keywords: /(?:jewel|CAD|\b3D\b|configurator|3D|render|mesh|material|stone|carat)/i,
    architectureHint: 'stateless render/asset pipeline + a file-processing service; heavy lifting off the request path (queue + object store)',
    designLanguage: 'large visualization workspace, precision controls, real-time preview, technical spec panels — the 3D view IS the product',
    dataModel: 'asset lineage (source CAD → processed → rendered), material/stone catalog with live pricing, versioned configurations',
    securityPosture: 'STANDARD',
    uxPatterns: ['canvas-first layout', 'precision numeric controls with unit conversion', 'preview fidelity over decoration', 'keyboard-driven fine adjust'],
    testingEmphasis: ['render-determinism (same seed → same output)', 'file validation on upload (size, format, content)', 'pricing recomputation on configuration change'],
    edgeDomains: ['CAD upload corrupt/truncated', 'material swap after price-lock', 'two users configuring the same order', 'render job failure mid-pipeline'],
  },
  {
    id: 'STREAMING_MEDIA',
    label: 'Streaming & media',
    keywords: /(?:stream|video|audio|playlist|transcode|HLS|playback|watch history|genre|media library)/i,
    architectureHint: 'ingest → transcode pipeline (queues), CDN delivery, metadata store separate from content store',
    designLanguage: 'image-led browsing, consistent loading states, smooth transitions, keyboard-first player',
    dataModel: 'media asset + rendition tables, watch state (sparse, high-volume), genre/tag graph, playback events',
    securityPosture: 'STANDARD',
    uxPatterns: ['responsive player with keyboard controls', 'discovery rails', 'resume-where-you-left-off', 'consistent skeleton loading'],
    testingEmphasis: ['streaming edge cases (seek at boundary, codec fallback)', 'playback-event ingestion at volume', 'CDN/asset URL expiry'],
    edgeDomains: ['transcode fails → serve source', 'simultaneous sessions on one account', 'content takedown mid-stream', 'gapless vs gapped metadata'],
  },
  {
    id: 'ECOMMERCE',
    label: 'E-commerce / retail',
    keywords: /(?:shop|store|product|inventory|coupon|promot|shipping|cart|checkout|variant|SKU)/i,
    architectureHint: 'modular monolith with an inventory service boundary; event-driven edges for search + analytics',
    designLanguage: 'strong product imagery, clear specs, effective discovery (filters + sort), mobile-first shopping, checkout clarity',
    dataModel: 'product/variant/SKU, stock with reservations, order lifecycle state machine, coupon eligibility rules',
    securityPosture: 'STANDARD',
    uxPatterns: ['product comparison', 'persistent cart', 'guest + account checkout', 'order tracking states visible to the buyer'],
    testingEmphasis: ['last-item race (two carts, one unit)', 'coupon stacking bounds', 'price change after cart-add', 'checkout idempotency'],
    edgeDomains: ['two customers buy the final item', 'seller changes price after cart-add', 'partial shipment', 'return after resale'],
  },
  {
    id: 'MARKETPLACE',
    label: 'Marketplace / bidding',
    keywords: /(?:marketplace|seller|commission|listing|bid|payout|vendor|dispute|escrow)/i,
    architectureHint: 'event-driven around listings + orders; settlement service with a ledger; per-seller balances',
    designLanguage: 'dual-audience (buyer + seller) navigation, trust signals (ratings, guarantees), transparent fee disclosure',
    dataModel: 'listing + escrow + settlement entities, commission rules (effective-dated), dispute lifecycle, seller balance ledger',
    securityPosture: 'HARDENED',
    uxPatterns: ['role-aware views', 'dispute flows with evidence', 'fee math shown to the seller'],
    testingEmphasis: ['commission + payout exactness', 'dispute state machine', 'cross-seller isolation', 'settlement idempotency'],
    edgeDomains: ['double payout', 'refund after partial sale', 'listing removed mid-bid', 'seller account frozen with pending orders'],
  },
  {
    id: 'BOOKING',
    label: 'Booking / reservations / scheduling',
    keywords: /(?:booking|reserv|schedul|appointment|calendar|slot|availability|itinerary)/i,
    architectureHint: 'modular monolith; a capacity service owns all slot math (single source of truth)',
    designLanguage: 'calendar-first layouts, fast reschedule, timezone honesty, confirmation states you can screenshot',
    dataModel: 'resource + slot + reservation state machines, hold/expiry rules, cancellation + refund policy table',
    securityPosture: 'STANDARD',
    uxPatterns: ['timezone-aware pickers', 'instant confirm vs pending states', 'reminder opt-ins'],
    testingEmphasis: ['overbooking race (concurrent holds)', 'timezone DST transitions', 'cancellation after partial payment', 'late-arrival states'],
    edgeDomains: ['two users reserve the last slot', 'provider cancels after client paid', 'no-show policies', 'reschedule across a rate change'],
  },
  {
    id: 'SAAS',
    label: 'SaaS / subscription',
    keywords: /(?:SaaS|subscription|tenant|workspace|seat|plan|renewal|usage[- ]based|metering)/i,
    architectureHint: 'modular monolith with tenant scoping as the first-class constraint; event outbox for usage/metering',
    designLanguage: 'onboarding as the hero, dense workspaces after, clear plan/limit communication',
    dataModel: 'tenant + membership + plan + entitlements + usage; every data table tenant-scoped',
    securityPosture: 'HARDENED',
    uxPatterns: ['guided onboarding', 'quota meters', 'admin vs member views', 'billing portal'],
    testingEmphasis: ['tenant isolation (cross-tenant read/write = BLOCKER)', 'proration on plan change', 'dunning (failed renewal) flow'],
    edgeDomains: ['user in multiple orgs', 'admin loses access to their org', 'usage crosses the plan limit mid-cycle', 'cancellation vs in-progress job'],
  },
  {
    id: 'ERP',
    label: 'Enterprise ERP / business operations',
    keywords: /(?:ERP|procurement|purchase order|payroll|approval chain|department|stock movement|asset register|S&OP)/i,
    architectureHint: 'modular monolith (or microservices ONLY with proven domain boundaries); heavy audit + approval chains',
    designLanguage: 'information-dense, powerful tables, advanced filters, inline editing, keyboard shortcuts, role-aware navigation',
    dataModel: 'approval DAGs, ledger + inventory integrity, period-close semantics, effective-dated master data',
    securityPosture: 'HARDENED',
    uxPatterns: ['bulk operations', 'activity history on every record', 'approval queues', 'export fidelity'],
    testingEmphasis: ['approval-chain completeness', 'period-close immutability', 'concurrent stock movement'],
    edgeDomains: ['approval chain loses its last approver', 'period closed but an adjustment arrives', 'two approvers approve simultaneously'],
  },
  {
    id: 'CRM',
    label: 'CRM / sales',
    keywords: /(?:CRM|lead|deal|pipeline stage|contact|chance|sales rep|opportunity)/i,
    architectureHint: 'modular monolith; a deal-state machine with stage + probability; activity feed as event log',
    designLanguage: 'fast record views, kanban pipeline, next-best-action surfaces',
    dataModel: 'lead → deal lifecycle, stage probabilities, touch history (append-only), ownership + assignment rules',
    securityPosture: 'HARDENED',
    uxPatterns: ['one-record view with timeline', 'quick create', 'stage-move with reasoning'],
    testingEmphasis: ['stage-transition invariants', 'lead ownership handover', 'duplicate-lead merge'],
    edgeDomains: ['deal owned by a departed rep', 'stage regression after commitment', 'two reps claim one lead'],
  },
  {
    id: 'PROJECT_MANAGEMENT',
    label: 'Project management / kanban',
    keywords: /(?:kanban|task board|Gantt|workload|sprint|milestone|swimlane|subtask|backlog)/i,
    architectureHint: 'modular monolith; a task graph (dependencies) + assignment engine; drag-and-drop is an input, server persists order',
    designLanguage: 'fast task creation, column drag with drop indicators, timeline + workload views, keyboard command layer',
    dataModel: 'task + dependency DAG + assignment; ordering via fractional ranks (concurrency-safe), optimistic updates',
    securityPosture: 'STANDARD',
    uxPatterns: ['drag-and-drop with keyboard alternatives (move menu)', 'bulk actions', 'dependency-aware reordering', 'activity history'],
    testingEmphasis: ['DAG integrity (no cycles)', 'concurrent reorder of the same board', 'drag undo/redo'],
    edgeDomains: ['task depends on itself after reordering', 'two users drop onto the same slot', 'milestone with unschedulable dependencies'],
  },
  {
    id: 'DEVTOOLS',
    label: 'Developer tools',
    keywords: /(?:developer tool|CLI|IDE|command palette|code review|monospace|log|diagnostic)/i,
    architectureHint: 'API-first; every surface available programmatically; deterministic output for testability',
    designLanguage: 'information hierarchy, monospace where it earns its keep, command palettes, structured logs, zero decorative motion',
    dataModel: 'execution + artifact tables; everything the UI shows is derivable from the CLI',
    securityPosture: 'HARDENED',
    uxPatterns: ['keyboard-first', 'copyable output', 'CI-friendly flags', 'predictable exit codes'],
    testingEmphasis: ['snapshot stability of CLI output', 'permission scoping', 'determinism (same input → same bytes)'],
    edgeDomains: ['tool invoked with no network', 'credential rotation mid-session', 'output piped vs interactive'],
  },
  {
    id: 'AI_APPLICATION',
    label: 'AI application',
    keywords: /(?:AI[- ]|LLM|prompt|inference|token|embedding|RAG|model|agent|chatbot|completion)/i,
    architectureHint: 'provider abstraction from day one (P07-style); a usage + cost meter is a first-class entity',
    designLanguage: 'honest streaming states (generating/thinking), grounded answers with sources, no fake confidence',
    dataModel: 'conversation + tool-call audit, usage/cost tables (the directive: track cost, not vibes), eval datasets',
    securityPosture: 'HARDENED',
    uxPatterns: ['regenerate + edit turns', 'citation affordances', 'cost visibility', 'stop/cancel mid-generation'],
    testingEmphasis: ['deterministic evals (seeded), provider-failure fallback', 'cost accounting exactness', 'prompt-injection guards on ingested content'],
    edgeDomains: ['provider timeout mid-stream', 'user edit races a regeneration', 'cost overage at the limit', 'tool result that is hostile content'],
  },
  {
    id: 'SOCIAL_COMMUNITY',
    label: 'Social / community',
    keywords: /(?:social|feed|follower|community|comment|group|post|reaction|moderat)/i,
    architectureHint: 'event-driven feed (fan-out tables), moderation pipeline as a queue, abuse signals as first-class events',
    designLanguage: 'content-first density, consistent post anatomy, moderation states visible',
    dataModel: 'post/reply/moderation-action append-only, relationship graph with soft-deletes, report lifecycle',
    securityPosture: 'HARDENED',
    uxPatterns: ['report + appeal flows', 'shadow-ban transparency where safe', 'block that is real (both directions)'],
    testingEmphasis: ['moderation race (report + delete simultaneously)', 'fan-out at volume', 'cross-post reference integrity on delete'],
    edgeDomains: ['post deleted while replies exist', 'moderator is the target', 'two users block each other', 'report spam flooding a queue'],
  },
  {
    id: 'EDUCATION',
    label: 'Education / learning',
    keywords: /(?:course|lesson|student|instructor|enroll|assessment|cohort|curriculum|certificate|LMS)/i,
    architectureHint: 'modular monolith; content + enrollment + progress as separate modules; offline-tolerant content delivery',
    designLanguage: 'reading comfort, progress that is honest, zero dark patterns on purchase',
    dataModel: 'content versioning (immutable per cohort), progress + attempt state machines, certificate issuance ledger',
    securityPosture: 'STANDARD',
    uxPatterns: ['resume-point on every course', 'attempts with clear rules', 'offline-first content'],
    testingEmphasis: ['attempts + grading invariants', 'content version freeze mid-course', 'certificate integrity (tamper-proof)'],
    edgeDomains: ['grade submitted after deadline grace ends', 'content updated mid-attempt', 'enrollment revoked with work in progress'],
  },
  {
    id: 'LOGISTICS',
    label: 'Logistics / delivery / supply chain',
    keywords: /(?:shipment|delivery|warehouse|route|carrier|tracking|freight|customs|dispatch)/i,
    architectureHint: 'event-driven around the shipment state machine; carrier adapters with idempotent callbacks',
    designLanguage: 'timeline of truth, exception queues over clean lists, map + status panels',
    dataModel: 'shipment state machine, scan events (append-only), exception + hold queues, proof-of-delivery',
    securityPosture: 'STANDARD',
    uxPatterns: ['exception triage views', 'live tracking states', 'carrier status translation (their code → your meaning)'],
    testingEmphasis: ['carrier callback replay (delayed/duplicate scans)', 'state machine forbidding impossible orders', 'hold/release races'],
    edgeDomains: ['delivered reported, then provider says failed', 'scan out of sequence', 'address unresolvable at dispatch'],
  },
  {
    id: 'REAL_ESTATE',
    label: 'Real estate / property',
    keywords: /(?:property|listing|apartment|landlord|tenant|rent|tenancy|valuation|mortgage)/i,
    architectureHint: 'modular monolith; listing lifecycle + escrow/settlement for transactions; document vault',
    designLanguage: 'image-led listings, spec tables that are honest, tour-booking clarity',
    dataModel: 'listing state machine, offer → escrow → settlement, document + consent records',
    securityPosture: 'HARDENED',
    uxPatterns: ['offer status visible to all parties', 'document status without jargon'],
    testingEmphasis: ['offer double-accept race', 'escrow state integrity', 'listing data correction (never overwrite history)'],
    edgeDomains: ['two offers accepted on one listing', 'escrow dispute', 'seller withdraws mid-escrow'],
  },
  {
    id: 'TRAVEL_HOSPITALITY',
    label: 'Travel & hospitality',
    keywords: /(?:hotel|flight|itinerary|reservation|check[- ]in|boarding|vacation|tour)/i,
    architectureHint: 'modular monolith + external provider adapters (cancellation windows live in a rules table, not code)',
    designLanguage: 'itinerary-as-timeline, timezone honesty everywhere, confirmation you can screenshot',
    dataModel: 'reservation + modifier rules (effective-dated), guest identity, cancellation policy graph',
    securityPosture: 'STANDARD',
    uxPatterns: ['one-tap rebooking where policy allows', 'guest identity shared with consent'],
    testingEmphasis: ['cancellation window boundaries', 'FX at booking vs settlement', 'no-show policies'],
    edgeDomains: ['policy changed between quote and payment', 'provider cancel after guest paid', 'timezone boundary night'],
  },
  {
    id: 'JOBS_RECRUITMENT',
    label: 'Job portal / recruitment',
    keywords: /(?:job portal|recruit|applicant|candidate|\bCV\b|résumé|interview|onboard)/i,
    architectureHint: 'modular monolith; application state machine; assessment results as immutable events',
    designLanguage: 'application progress the candidate can see, zero dead-end states',
    dataModel: 'application + stage + event log, candidate consent + data-retention rules',
    securityPosture: 'HARDENED',
    uxPatterns: ['application status with reasons', 'resubmission rules'],
    testingEmphasis: ['stage-transition audit', 'candidate data retention expiry', 'interview schedule conflicts'],
    edgeDomains: ['candidate withdraws mid-interview', 'role closed with open applications', 'two interviewers, same slot'],
  },
  {
    id: 'MANUFACTURING',
    label: 'Manufacturing / inventory operations',
    keywords: /(?:manufactur|bill of materials|\bBOM\b|raw material|wastage|machine utilization|production stage|work order|line)/i,
    architectureHint: 'event-driven around work orders; stock as a ledger (movements, never overwrite)',
    designLanguage: 'operational dashboards, exception-first, print + scan affordances',
    dataModel: 'stock ledger + BOM graph, work-order state machine, quality-hold states',
    securityPosture: 'STANDARD',
    uxPatterns: ['line-side status boards', 'scan-to-receive', 'quality hold release'],
    testingEmphasis: ['stock movement integrity (ledger sums to physical)', 'BOM version change mid-order', 'rework loops'],
    edgeDomains: ['material shortage mid-work-order', 'BOM changed after dispatch', 'scrap vs rework classification'],
  },
  {
    id: 'CREATOR_DIGITAL',
    label: 'Digital services / creator platforms',
    keywords: /(?:creator|membership|patron|tip|license|digital good|download|course bundle|fan)/i,
    architectureHint: 'modular monolith; entitlements + usage as the core; delivery as an idempotent job',
    designLanguage: 'creator-led voice, purchase receipt clarity, fan-facing consistency',
    dataModel: 'entitlement tables, download + access expiry, revenue split (commission) rules',
    securityPosture: 'STANDARD',
    uxPatterns: ['access that survives re-login', 'receipts a fan can show a provider'],
    testingEmphasis: ['entitlement expiry boundaries', 'download replay (at-least-once delivery)', 'commission exactness'],
    edgeDomains: ['purchase reversed but download kept', 'creator delisted mid-access', 'tip rounding across currencies'],
  },
  {
    id: 'INTERNAL_BUSINESS',
    label: 'Internal business software',
    keywords: /(?:internal tool|intranet|admin panel|operations dashboard|ops tool|ticketing|incident)/i,
    architectureHint: 'modular monolith, boring on purpose; audit + SSO before fancy features',
    designLanguage: 'density + keyboard speed beat polish; zero training cost',
    dataModel: 'workflow + approval tables, full audit, role-based visibility',
    securityPosture: 'HARDENED',
    uxPatterns: ['bulk ops', 'search-everything', 'role-scoped nav'],
    testingEmphasis: ['permission matrix completeness', 'audit row on every mutation', 'SSO edge (terminated employee)'],
    edgeDomains: ['terminated user with open approvals', 'two admins same action', 'audit log growth policy'],
  },
  {
    id: 'DESKTOP_APP',
    label: 'Desktop application',
    keywords: /(?:desktop app|electron|tauri|native app|install|local file|filesystem|sync|offline)/i,
    architectureHint: 'local-first store + sync engine; update + offline states are core, not afterthoughts',
    designLanguage: 'platform-native affordances, offline-first, zero cloud-assumption',
    dataModel: 'local CRDT/vector-clock state, sync ledger, conflict resolution rules',
    securityPosture: 'STANDARD',
    uxPatterns: ['offline indicator always visible', 'sync conflicts surfaced, not silent'],
    testingEmphasis: ['sync conflict resolution', 'partial network', 'update in-progress with open documents'],
    edgeDomains: ['two devices edit offline then sync', 'storage full mid-write', 'update fails halfway'],
  },
  {
    id: 'MOBILE_APP',
    label: 'Mobile application',
    keywords: /(?:mobile app|ios|android|react native|flutter|push notification|app store|gesture|thumb)/i,
    architectureHint: 'thin client + API; push + background policies per platform; store review is a design constraint',
    designLanguage: 'thumb-zone ergonomics, gesture + touch targets, data-charge awareness, battery honesty',
    dataModel: 'device + session + push-token lifecycle, offline queue',
    securityPosture: 'STANDARD',
    uxPatterns: ['thumb-zone primary actions', 'pull-to-refresh expectations', 'deep links that restore state'],
    testingEmphasis: ['background/foreground transitions', 'push delivery + permission states', 'weak network retries'],
    edgeDomains: ['app force-quit mid-submit', 'push token rotation', 'low-battery throttling'],
  },
  {
    id: 'GAME',
    label: 'Game',
    keywords: /(?:game|playable|score|level|gameplay|sprite|physics|leaderboard|play session)/i,
    architectureHint: 'deterministic core sim + authoritative server for multiplayer; save/replay',
    designLanguage: 'the gameplay loop IS the design; HUD clarity, zero loading-shame',
    dataModel: 'game-state snapshots, session + replay, progression ledger',
    securityPosture: 'STANDARD',
    uxPatterns: ['pause-safe, accessible controls', 'progression visible'],
    testingEmphasis: ['determinism (same seed → same game)', 'anti-cheat invariants', 'save corruption recovery'],
    edgeDomains: ['two clients diverge on one tick', 'save file corrupt', 'leaderboard replay abuse'],
  },
  {
    id: 'API_INFRASTRUCTURE',
    label: 'API / infrastructure project',
    keywords: /(?:API[- ]only|gateway|SDK|webhook|rate limit|SLA|uptime|provider API|headless)/i,
    architectureHint: 'stateless service + idempotency keys; versioned public contracts; webhook delivery as at-least-once',
    designLanguage: 'the API is the product: consistent errors, pagination, docs-as-code',
    dataModel: 'usage + idempotency tables, webhook delivery ledger',
    securityPosture: 'HARDENED',
    uxPatterns: ['developer experience: quickstarts, sandbox keys, curl-ready docs'],
    testingEmphasis: ['contract versioning (no breaking changes)', 'webhook replay', 'rate-limit boundaries'],
    edgeDomains: ['webhook replay after downtime', 'consumer API key rotation', 'rate-limit burst vs sustained'],
  },
  {
    id: 'DATA_INTENSIVE',
    label: 'Data-intensive application',
    keywords: /(?:ETL|data warehouse|analytics|pipeline|streaming|telemetry|time series|olap|spark)/i,
    architectureHint: 'separate transactional + analytical stores; pipelines as versioned, replayable jobs; lineage as data',
    designLanguage: 'query-first dashboards, honest data-freshness indicators, no decorative charts',
    dataModel: 'fact + dimension modeling, retention tiers, lineage graph, data-quality checks',
    securityPosture: 'DATA_RESIDENT',
    uxPatterns: ['row counts always shown', 'stale-data labels', 'export fidelity'],
    testingEmphasis: ['idempotent pipeline replay', 'data-quality checks as gates', 'backfill without corrupting live data'],
    edgeDomains: ['pipeline replays a range twice', 'upstream schema change', 'late data for a closed period'],
  },
];

/** UNSEEN is intentionally last-resort; it never matches by keyword. */
export const UNSEEN_PROFILE: CategoryProfile = {
  id: 'UNSEEN',
  label: 'Previously unseen product (first-principles)',
  keywords: // matches nothing — the classifier assigns UNSEEN by absence
  /^$#/,
  architectureHint: 'derive from the stated problem (P11 architecture engine inputs)',
  designLanguage: 'derive from the primary user journey',
  dataModel: 'model the entities the problem names, then the invariants',
  securityPosture: 'STANDARD',
  uxPatterns: ['solve the named user problem before anything else'],
  testingEmphasis: ['the stated failure modes, each with a reproducible test'],
  edgeDomains: ['the failure the user has not described yet (P13 edge-case engine surfaces it)'],
};

export function profileFor(id: ProjectCategory): CategoryProfile | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
