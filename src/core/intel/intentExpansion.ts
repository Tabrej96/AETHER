/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — INTENT EXPANSION AND DOMAIN INTELLIGENCE ENGINE
 * (src/core/intel/intentExpansion.ts) · Created by Tabrej
 *
 * Receives a raw user prompt and expands it into a comprehensive ProductSpec
 * by detecting intent keywords, mapping to product types, and applying domain
 * intelligence. Every field is derived from domain knowledge — unknowns are
 * explicitly flagged, assumptions are recorded with confidence levels.
 */

import { domainPacks, domainModels, type DomainModel } from './domainPacks';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface ProductSpec {
  intent: string;
  productType: string;
  confidence: number;
  domains: string[];
  userPersonas: PersonaSpec[];
  businessModel: BusinessModelSpec;
  featureRequirements: FeatureRequirement[];
  technicalRequirements: TechRequirement[];
  operationalRequirements: OperationalRequirement[];
  designRequirements: DesignRequirement[];
  securityRequirements: SecurityRequirement[];
  testingRequirements: TestingRequirement[];
  deploymentRequirements: DeploymentRequirement[];
  integrationRequirements: IntegrationRequirement[];
  unknowns: string[];
  assumptions: AssumptionSpec[];
}

export interface PersonaSpec {
  role: string;
  name: string;
  needs: string[];
  permissions: string[];
}

export interface BusinessModelSpec {
  modelType: string;
  revenueStreams: string[];
  costStructure: string[];
  pricingStrategy: string[];
}

export interface FeatureRequirement {
  category: string;
  name: string;
  description: string;
  priority: 'essential' | 'expected' | 'differentiating' | 'optional';
  dependencies: string[];
}

export interface TechRequirement {
  category: string;
  name: string;
  description: string;
  rationale: string;
}

export interface OperationalRequirement {
  category: string;
  name: string;
  description: string;
}

export interface DesignRequirement {
  category: string;
  name: string;
  description: string;
  rationale: string;
}

export interface SecurityRequirement {
  category: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface TestingRequirement {
  category: string;
  name: string;
  description: string;
  priority: 'essential' | 'expected' | 'differentiating' | 'optional';
}

export interface DeploymentRequirement {
  category: string;
  name: string;
  description: string;
}

export interface IntegrationRequirement {
  target: string;
  purpose: string;
  protocol: string;
}

export interface AssumptionSpec {
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: string }> = [
  { pattern: /\b(build|create|make|develop|design|generate|construct|launch|ship)\b/i, intent: 'build' },
  { pattern: /\b(i\s+(?:want|need|would like|wish|plan))\b/i, intent: 'desire' },
  { pattern: /\b(let'?s\s+(?:make|build|create|design|develop))\b/i, intent: 'collaborative' },
  { pattern: /\b(turn\s+(?:this|that|the)\s+(?:idea|concept|thing)\s+into)\b/i, intent: 'transform' },
  // Hindi (Devanagari + common transliterations)
  { pattern: /बनाओ|बनाना|बनाइये/i, intent: 'build' },
  { pattern: /चाहिए|चाहता|चाहती|चाहते/i, intent: 'desire' },
  // Spanish
  { pattern: /\b(construir|crear|hacer|desarrollar|diseñar|lanzar|generar)\b/i, intent: 'build' },
  { pattern: /\b(quiero|necesito|me\s+gustaría|deseo)\b/i, intent: 'desire' },
  // French
  { pattern: /\b(construire|créer|faire|développer|concevoir|lancer|générer)\b/i, intent: 'build' },
  { pattern: /\b(je\s+veux|j'ai\s+besoin|je\s+souhaite|je\s+désire)\b/i, intent: 'desire' },
  // German
  { pattern: /\b(bauen|erstellen|machen|entwickeln|gestalten|starten|generieren)\b/i, intent: 'build' },
  { pattern: /\b(ich\s+will|ich\s+brauche|ich\s+möchte|ich\s+wünsche)\b/i, intent: 'desire' },
  // Japanese (Katakana loanwords + kanji)
  { pattern: /作り|作成|開発|構築|生成|デザイン/i, intent: 'build' },
  { pattern: /欲しい|作りたい|必要|希望/i, intent: 'desire' },
  // Chinese (Simplified + Traditional)
  { pattern: /构建|创建|制作|开发|设计|建立|生成/i, intent: 'build' },
  { pattern: /想要|需要|希望|要做|想要做/i, intent: 'desire' },
  // Arabic
  { pattern: /\b(بناء|إنشاء|تطوير|تصميم|إطلاق|توليد)\b/i, intent: 'build' },
  { pattern: /\b(أريد|أحتاج|أرغب|أود|نريد)\b/i, intent: 'desire' },
  // Portuguese
  { pattern: /\b(construir|criar|fazer|desenvolver|projetar|lançar|gerar)\b/i, intent: 'build' },
  { pattern: /\b(quero|preciso|gostaria|desejo|necessito)\b/i, intent: 'desire' },
  // Korean
  { pattern: /만들|구축|개발|설계|생성/i, intent: 'build' },
  { pattern: /원해|필요|원해요|만들고/i, intent: 'desire' },
];

function detectIntent(prompt: string): { intent: string; confidence: number } {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(prompt)) {
      // Count how many patterns matched to gauge confidence
      const matches = INTENT_PATTERNS.filter((p) => p.pattern.test(prompt)).length;
      const confidence = Math.min(0.5 + matches * 0.25, 1.0);
      return { intent, confidence };
    }
  }
  return { intent: 'unknown', confidence: 0.0 };
}

// ---------------------------------------------------------------------------
// Product type detection
// ---------------------------------------------------------------------------

const PRODUCT_TYPE_MAP: Array<{ patterns: RegExp[]; type: string; domains: string[] }> = [
  {
    patterns: [/\bcoffee\s+shop\b/i, /\bcofi\b/i, /\bcaf[eé]\b/i, /\bbarista\b/i, /\bespresso\b/i, /\blatte\b/i, /\bcappuccino\b/i, /\bamericano\b/i, /\bmocha\b/i],
    type: 'coffee_shop',
    domains: ['coffee_shop'],
  },
  {
    patterns: [/\be[- ]?commerce\b/i, /\bonline\s+store\b/i, /\bshop\b/i, /\bmarketplace\b/i, /\bsell\s+products?\s+online\b/i, /\bproduct\s+catalog\b/i],
    type: 'ecommerce',
    domains: ['ecommerce'],
  },
  {
    patterns: [/\bsaas\b/i, /\bsoftware\s+as\s+a\s+service\b/i, /\bmulti[- ]tenant\b/i, /\bsaas\s+platform\b/i, /\bsubscription\s+software\b/i],
    type: 'saas',
    domains: ['saas'],
  },
  {
    patterns: [/\bmanufacturing\b/i, /\bfactory\b/i, /\bproduction\s+planning\b/i, /\bbill\s+of\s+materials\b/i, /\bBOM\b/i, /\bwork\s+order\b/i],
    type: 'manufacturing',
    domains: ['manufacturing'],
  },
  {
    patterns: [/\bjewellery\b/i, /\bjewelry\b/i, /\bgem\b/i, /\bdiamond\b/i, /\bengagement\s+ring\b/i, /\bgold\s+shop\b/i],
    type: 'jewellery',
    domains: ['jewellery'],
  },
  {
    patterns: [/\brestaurant\b/i, /\bdining\b/i, /\bfood\s+ordering\b/i, /\bkitchen\s+management\b/i, /\breservation\b/i, /\bmenu\s+management\b/i, /\bfood\s+delivery\b/i],
    type: 'restaurant',
    domains: ['restaurant'],
  },
  {
    patterns: [/\bmarketplace\b/i, /\bvendor\s+platform\b/i, /\bcommission\s+model\b/i, /\bmulti[- ]vendor\b/i, /\bseller\s+platform\b/i],
    type: 'marketplace',
    domains: ['marketplace', 'ecommerce'],
  },
  {
    patterns: [/\beducation\b/i, /\blearning\s+platform\b/i, /\bcourse\b/i, /\bLMS\b/i, /\bstudent\s+management\b/i, /\binstructor\b/i, /\bonline\s+course\b/i],
    type: 'education',
    domains: ['education'],
  },
  {
    patterns: [/\bhealthcare\b/i, /\bpatient\s+management\b/i, /\bmedical\s+records?\b/i, /\bHIPAA\b/i, /\bclinic\b/i, /\bhospital\b/i, /\bappointment\s+system\b/i],
    type: 'healthcare',
    domains: ['healthcare'],
  },
  {
    patterns: [/\bfinance\b/i, /\bbanking\b/i, /\baccounting\b/i, /\bpayment\s+system\b/i, /\binvoice\b/i, /\bbilling\s+system\b/i, /\btransaction\s+management\b/i],
    type: 'finance',
    domains: ['finance'],
  },
  {
    patterns: [/\bentertainment\b/i, /\bstreaming\b/i, /\bvideo\s+platform\b/i, /\bmovie\s+app\b/i, /\bmusic\s+platform\b/i, /\bsubscription\s+media\b/i],
    type: 'entertainment',
    domains: ['entertainment'],
  },
  {
    patterns: [/\besports\b/i, /\btournament\b/i, /\besports\s+platform\b/i, /\bgaming\s+tournament\b/i, /\blesports\b/i],
    type: 'esports',
    domains: ['esports'],
  },
  {
    patterns: [/\bgaming\b/i, /\bgame\s+platform\b/i, /\bvideo\s+game\b/i, /\bmobile\s+game\b/i, /\bgame\s+server\b/i],
    type: 'gaming',
    domains: ['gaming'],
  },
  {
    patterns: [/\bai\s+assistant\b/i, /\bchatbot\b/i, /\bvirtual\s+assistant\b/i, /\bconversational\s+ai\b/i, /\bai\s+agent\b/i, /\bintelligent\s+assistant\b/i],
    type: 'ai_assistant',
    domains: ['ai_assistant'],
  },
  {
    patterns: [/\bsocial\s+network\b/i, /\bsocial\s+media\b/i, /\bsocial\s+platform\b/i, /\bfeed\s+app\b/i, /\bsocial\s+app\b/i],
    type: 'social',
    domains: ['social'],
  },
  {
    patterns: [/\bmedia\s+platform\b/i, /\bcontent\s+management\b/i, /\bpublishing\b/i, /\bCMS\b/i, /\bnews\s+platform\b/i, /\bblogging\s+platform\b/i],
    type: 'media',
    domains: ['media'],
  },
  {
    patterns: [/\blogistics\b/i, /\bshipping\b/i, /\bsupply\s+chain\b/i, /\btracking\b/i, /\bdelivery\s+management\b/i, /\bfleet\s+management\b/i],
    type: 'logistics',
    domains: ['logistics'],
  },
  {
    patterns: [/\bbooking\s+system\b/i, /\breservation\s+system\b/i, /\bscheduling\b/i, /\bappointment\s+booking\b/i, /\bresource\s+booking\b/i],
    type: 'booking',
    domains: ['booking'],
  },
  {
    patterns: [/\bproductivity\b/i, /\btask\s+management\b/i, /\bproject\s+management\b/i, /\bcollaboration\s+tool\b/i, /\bteam\s+workspace\b/i, /\bnotes?\s+app\b/i],
    type: 'productivity',
    domains: ['productivity'],
  },
  {
    patterns: [/\bdeveloper\s+tools?\b/i, /\bCI[\s/]?CD\b/i, /\bdevops\b/i, /\brepository\s+management\b/i, /\bdeployment\s+pipeline\b/i, /\bcode\s+hosting\b/i],
    type: 'developer_tools',
    domains: ['developer_tools'],
  },
  {
    patterns: [/\benterprise\b/i, /\bERP\b/i, /\benterprise\s+platform\b/i, /\bdepartment\s+management\b/i, /\bapproval\s+workflow\b/i, /\bcorporate\b/i],
    type: 'enterprise',
    domains: ['enterprise'],
  },
];

function detectProductType(prompt: string): { type: string; domains: string[]; confidence: number } {
  for (const entry of PRODUCT_TYPE_MAP) {
    const matches = entry.patterns.filter((p) => p.test(prompt)).length;
    if (matches > 0) {
      const confidence = Math.min(0.6 + matches * 0.15, 1.0);
      return { type: entry.type, domains: entry.domains, confidence };
    }
  }
  return { type: 'unknown', domains: ['general'], confidence: 0.0 };
}

// ---------------------------------------------------------------------------
// Expansion helpers
// ---------------------------------------------------------------------------

function pickDomain(prompt: string, detectedType: string): DomainModel {
  const model = domainModels.find((m) => m.id === detectedType);
  if (model) return model;
  return domainModels.find((m) => m.id === 'ecommerce') ?? domainModels[0]!;
}

function expandPersonas(domain: DomainModel): PersonaSpec[] {
  const roles = (domain as Record<string, unknown>).userRoles as Array<{ id: string; name: string; typicalFeatures: string[]; permissions: string[] }> | undefined;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return [{ role: 'User', name: 'General User', needs: ['Access to core features'], permissions: ['read'] }];
  }
  return roles.map((r) => ({
    role: r.id,
    name: r.name,
    needs: r.typicalFeatures.map((f) => `Access to ${f}`),
    permissions: r.permissions,
  }));
}

function expandFeatures(domain: DomainModel): FeatureRequirement[] {
  const priorityOrder: Array<FeatureRequirement['priority']> = ['essential', 'expected', 'differentiating', 'optional'];
  const allFeatures = (domain as Record<string, unknown>).standardFeatures as Array<{ category: string; name: string; description: string; priority: string; dependencies?: string[] }> | undefined;
  if (!allFeatures || !Array.isArray(allFeatures) || allFeatures.length === 0) {
    return [
      { category: 'core', name: 'Core Application', description: 'Primary application functionality', priority: 'essential', dependencies: [] },
    ];
  }
  const result: FeatureRequirement[] = [];
  for (const p of priorityOrder) {
    const group = allFeatures.filter((f) => f.priority === p);
    for (const f of group) {
      result.push({
        category: f.category,
        name: f.name,
        description: f.description,
        priority: p,
        dependencies: f.dependencies ?? [],
      });
    }
  }
  return result;
}

function expandBusinessModel(domain: DomainModel): BusinessModelSpec {
  const models = (domain as Record<string, unknown>).businessModels as Array<{ modelType: string; revenueStreams: string[]; costStructure: string[]; pricingStrategy: string[] }> | undefined;
  const list = models && Array.isArray(models) && models.length > 0 ? models : [{ modelType: 'Unknown', revenueStreams: [], costStructure: [], pricingStrategy: [] }];
  const primary = list[0];
  return {
    modelType: primary.modelType,
    revenueStreams: primary.revenueStreams,
    costStructure: primary.costStructure,
    pricingStrategy: primary.pricingStrategy,
  };
}

function expandTechRequirements(domain: DomainModel): TechRequirement[] {
  const patterns = (domain as Record<string, unknown>).technicalPatterns as Array<{ category: string; name: string; description: string; rationale?: string }> | undefined;
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return [
      { category: 'hosting', name: 'Cloud Hosting', description: 'Deploy to managed cloud platform', rationale: `Standard pattern for ${domain.name}` },
      { category: 'caching', name: 'CDN & Caching', description: 'Static assets via CDN, API caching layer', rationale: `Standard pattern for ${domain.name}` },
      { category: 'scaling', name: 'Auto-scaling', description: 'Scale horizontally based on load', rationale: `Standard pattern for ${domain.name}` },
    ];
  }
  return patterns.map((p) => ({
    category: p.category,
    name: p.name,
    description: p.description,
    rationale: p.rationale ?? `Standard pattern for ${domain.name}`,
  }));
}

function expandOperationalRequirements(domain: DomainModel): OperationalRequirement[] {
  const lifecycle = (domain as Record<string, unknown>).operationalLifecycle as Array<{ id: string; name: string; description: string }> | undefined;
  if (!lifecycle || !Array.isArray(lifecycle) || lifecycle.length === 0) {
    return [
      { category: 'deployment', name: 'Deploy', description: 'Deploy to production environment' },
      { category: 'monitoring', name: 'Monitor', description: 'Monitor application health and performance' },
      { category: 'maintenance', name: 'Maintain', description: 'Regular maintenance and updates' },
    ];
  }
  return lifecycle.map((s) => ({
    category: s.id,
    name: s.name,
    description: s.description,
  }));
}

function expandDesignRequirements(domain: DomainModel): DesignRequirement[] {
  const principles = (domain as Record<string, unknown>).designPrinciples as Array<{ name: string; description: string }> | undefined;
  if (!principles || !Array.isArray(principles) || principles.length === 0) {
    return [
      { category: 'UX', name: 'Usability', description: 'Intuitive and easy to use', rationale: 'Usability is a core design principle' },
      { category: 'UX', name: 'Accessibility', description: 'Accessible to all users', rationale: 'Accessibility is a core design principle' },
      { category: 'UX', name: 'Responsiveness', description: 'Works across devices', rationale: 'Responsiveness is a core design principle' },
    ];
  }
  return principles.map((p) => ({
    category: 'UX',
    name: p.name,
    description: p.description,
    rationale: p.description,
  }));
}

function expandSecurityRequirements(domain: DomainModel): SecurityRequirement[] {
  const items: SecurityRequirement[] = [];
  const sec = (domain as Record<string, unknown>).securityConsiderations as Array<{ category: string; name: string; description: string; severity: string }> | undefined;
  if (sec && Array.isArray(sec)) {
    for (const s of sec) {
      items.push({ category: s.category, name: s.name, description: s.description, severity: s.severity });
    }
  }
  const regs = (domain as Record<string, unknown>).regulations as Array<{ name: string; requirements: string[] }> | undefined;
  if (regs && Array.isArray(regs)) {
    for (const reg of regs) {
      items.push({
        category: 'Compliance',
        name: `${reg.name} Compliance`,
        description: `Must comply with ${reg.name}: ${reg.requirements.join('; ')}`,
        severity: reg.name.includes('HIPAA') || reg.name.includes('PCI') ? 'critical' : 'high',
      });
    }
  }
  if (items.length === 0) {
    items.push(
      { category: 'authentication', name: 'Authentication', description: 'Implement secure authentication', severity: 'high' },
      { category: 'authorization', name: 'Authorization', description: 'Implement role-based access control', severity: 'high' },
      { category: 'encryption', name: 'Data Encryption', description: 'Encrypt data at rest and in transit', severity: 'high' },
    );
  }
  return items;
}

function expandTestingRequirements(domain: DomainModel): TestingRequirement[] {
  const tests = (domain as Record<string, unknown>).testingRequirements as Array<{ category: string; name: string; description: string; priority: string }> | undefined;
  const result: TestingRequirement[] = [];
  if (tests && Array.isArray(tests)) {
    for (const t of tests) {
      result.push({ category: t.category, name: t.name, description: t.description, priority: t.priority });
    }
  }
  // Ensure at least some test requirements exist
  if (result.length === 0) {
    result.push(
      { category: 'functional', name: 'Unit Tests', description: 'All business logic functions', priority: 'essential' },
      { category: 'integration', name: 'Integration Tests', description: 'API endpoint coverage', priority: 'essential' },
      { category: 'e2e', name: 'End-to-End Tests', description: 'Critical user journeys', priority: 'expected' },
    );
  }
  return result;
}

function expandDeploymentRequirements(domain: DomainModel): DeploymentRequirement[] {
  const patterns = (domain as Record<string, unknown>).technicalPatterns as Array<{ category: string; name: string; description: string; rationale?: string }> | undefined;
  const deployPatterns = patterns?.filter((p) => /deploy|host|cloud|server|cdn/i.test(p.name + p.description));
  if (deployPatterns && deployPatterns.length > 0) {
    return deployPatterns.map((p) => ({
      category: 'infrastructure',
      name: p.name,
      description: p.description,
    }));
  }
  return [
    { category: 'hosting', name: 'Cloud Hosting', description: 'Deploy to managed cloud platform' },
    { category: 'caching', name: 'CDN & Caching', description: 'Static assets via CDN, API caching layer' },
    { category: 'scaling', name: 'Auto-scaling', description: 'Scale horizontally based on load' },
  ];
}

function expandIntegrationRequirements(domain: DomainModel): IntegrationRequirement[] {
  const integrations: IntegrationRequirement[] = [];
  if (/ecommerce|marketplace|commerce/i.test(domain.id)) {
    integrations.push(
      { target: 'Payment Gateway', purpose: 'Process payments', protocol: 'HTTPS/REST' },
      { target: 'Shipping Carrier', purpose: 'Calculate rates, generate labels', protocol: 'REST API' },
      { target: 'Email Service', purpose: 'Order confirmations, notifications', protocol: 'SMTP/API' },
    );
  }
  if (/coffee|restaurant|booking/i.test(domain.id)) {
    integrations.push(
      { target: 'Payment Gateway', purpose: 'Process payments', protocol: 'HTTPS/REST' },
      { target: 'Notification Service', purpose: 'Order/reservation alerts', protocol: 'WebSocket/Push' },
      { target: 'SMS Service', purpose: 'Customer notifications', protocol: 'SMS API' },
    );
  }
  if (/saas|enterprise|productivity/i.test(domain.id)) {
    integrations.push(
      { target: 'Authentication Provider', purpose: 'SSO / identity', protocol: 'OAuth2 / OIDC' },
      { target: 'Email Service', purpose: 'Transactional emails', protocol: 'SMTP/API' },
      { target: 'Analytics Platform', purpose: 'Usage tracking', protocol: 'Event API' },
    );
  }
  if (/finance|healthcare/i.test(domain.id)) {
    integrations.push(
      { target: 'Audit Logger', purpose: 'Compliance audit trail', protocol: 'Internal Event Bus' },
      { target: 'Encryption Service', purpose: 'Data at rest encryption', protocol: 'KMS API' },
    );
  }
  if (integrations.length === 0) {
    integrations.push(
      { target: 'Email Service', purpose: 'Transactional emails', protocol: 'SMTP/API' },
      { target: 'Monitoring', purpose: 'Observability', protocol: 'Prometheus/OTel' },
    );
  }
  return integrations;
}

function detectUnknowns(prompt: string, domain: DomainModel): string[] {
  const unknowns: string[] = [];
  // Check for missing business model info
  if (!/\b(pricing|subscription|free|freemium|one.time|recurring)\b/i.test(prompt)) {
    unknowns.push('Pricing model not specified — what pricing strategy fits this product?');
  }
  // Check for missing platform info
  if (!/\b(web|mobile|desktop|app|ios|android)\b/i.test(prompt)) {
    unknowns.push('Target platform(s) not specified — web, mobile, desktop, or all?');
  }
  // Check for missing user scale
  if (!/\b(\d+[\s]*(?:users|customers|clients|employees|students|patients|orders|stores?|locations?))\b/i.test(prompt)) {
    unknowns.push('Expected user volume not specified — how many concurrent users / orders per day?');
  }
  // Check for missing integrations
  if (!/\b(payment|shipping|email|sms|analytics|auth|oauth|SSO)\b/i.test(prompt)) {
    unknowns.push('Required third-party integrations not specified — which services must be connected?');
  }
  // Check for missing compliance requirements
  const regs = (domain as Record<string, unknown>).regulations as Array<{ name: string; requirements: string[] }> | undefined;
  if (!/\b(GDPR|HIPAA|PCI|SOC|compliance|audit)\b/i.test(prompt) && regs && regs.length > 0) {
    unknowns.push(`Compliance requirements not specified — this domain typically requires: ${regs.map((r) => r.name).join(', ')}. Which apply?`);
  }
  // Domain-specific unknowns
  if (domain.id === 'coffee_shop') {
    unknowns.push('Roasting preferences and supply chain details not specified.');
  }
  if (domain.id === 'education') {
    unknowns.push('Assessment types and grading methodology not specified.');
  }
  if (domain.id === 'manufacturing') {
    unknowns.push('Production capacity targets and quality standards not specified.');
  }
  if (domain.id === 'healthcare') {
    unknowns.push('Patient record format (FHIR, HL7) and data retention policy not specified.');
  }
  return unknowns;
}

function generateAssumptions(prompt: string, domain: DomainModel): AssumptionSpec[] {
  const assumptions: AssumptionSpec[] = [
    { description: 'User is building a digital product (not a physical product without software)', confidence: 0.95, impact: 'medium' },
    { description: 'System will be deployed online with web or mobile access', confidence: 0.90, impact: 'low' },
    { description: 'User has access to basic cloud infrastructure', confidence: 0.85, impact: 'low' },
  ];
  // Domain-specific assumptions
  if (/coffee|restaurant|booking/i.test(domain.id)) {
    assumptions.push({ description: 'Online payment processing is required', confidence: 0.90, impact: 'high' });
  }
  if (/finance|ecommerce|marketplace/i.test(domain.id)) {
    assumptions.push({ description: 'PCI-DSS compliance is required for payment processing', confidence: 0.90, impact: 'high' });
  }
  if (/healthcare/i.test(domain.id)) {
    assumptions.push({ description: 'HIPAA compliance is mandatory', confidence: 0.95, impact: 'high' });
  }
  if (/saas|enterprise/i.test(domain.id)) {
    assumptions.push({ description: 'Multi-tenant architecture with role-based access control', confidence: 0.85, impact: 'high' });
  }
  if (/ecommerce|marketplace|retail/i.test(domain.id)) {
    assumptions.push({ description: 'Product catalog with search and filtering is required', confidence: 0.88, impact: 'medium' });
  }
  if (assumptions.length < 5) {
    assumptions.push({ description: 'Standard web security practices (HTTPS, input validation, auth)', confidence: 0.92, impact: 'high' });
  }
  return assumptions;
}

function detectNormalizedIntent(prompt: string): string {
  const clean = prompt
    .replace(/^(build|create|make|develop|design|generate|launch|construct|i want|let's make|let's build|turn this idea into|turn this into)\s*/i, '')
    .replace(/\b(a|an|the|my|our|a new|the new|some)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return clean.length > 3 ? clean : prompt.toLowerCase();
}

// ---------------------------------------------------------------------------
// Main expansion function
// ---------------------------------------------------------------------------

export function expandIntent(rawPrompt: string): ProductSpec {
  const trimmed = rawPrompt.trim();
  const { intent, confidence: intentConfidence } = detectIntent(trimmed);
  const { type: productType, domains, confidence: typeConfidence } = detectProductType(trimmed);

  const overallConfidence = intentConfidence * typeConfidence;
  const domain = pickDomain(trimmed, productType);
  const normalizedIntent = detectNormalizedIntent(trimmed);

  return {
    intent: normalizedIntent,
    productType,
    confidence: Math.min(overallConfidence, 1.0),
    domains,
    userPersonas: expandPersonas(domain),
    businessModel: expandBusinessModel(domain),
    featureRequirements: expandFeatures(domain),
    technicalRequirements: expandTechRequirements(domain),
    operationalRequirements: expandOperationalRequirements(domain),
    designRequirements: expandDesignRequirements(domain),
    securityRequirements: expandSecurityRequirements(domain),
    testingRequirements: expandTestingRequirements(domain),
    deploymentRequirements: expandDeploymentRequirements(domain),
    integrationRequirements: expandIntegrationRequirements(domain),
    unknowns: detectUnknowns(trimmed, domain),
    assumptions: generateAssumptions(trimmed, domain),
  };
}
