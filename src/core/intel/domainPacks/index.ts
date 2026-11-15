import { COFFEE_SHOP_PACK } from './coffeeShop.js';
import { ECOMMERCE_PACK } from './ecommerce.js';
import { SAAS_PACK } from './saas.js';
import { LOGISTICS_PACK, LOGISTICS_DOMAIN } from './logistics.js';
import { BOOKING_PACK, BOOKING_DOMAIN } from './booking.js';
import { PRODUCTIVITY_PACK, PRODUCTIVITY_DOMAIN } from './productivity.js';
import { DEVELOPER_TOOLS_PACK, DEVELOPER_TOOLS_DOMAIN } from './developerTools.js';
import { ENTERPRISE_PACK, ENTERPRISE_DOMAIN } from './enterprise.js';
import { JEWELLERY_PACK, JEWELLERY_DOMAIN } from './jewellery.js';
import { MANUFACTURING_PACK, MANUFACTURING_DOMAIN } from './manufacturing.js';
import { RESTAURANT_PACK, RESTAURANT_DOMAIN } from './restaurant.js';
import { MARKETPLACE_PACK, MARKETPLACE_DOMAIN } from './marketplace.js';
import { EDUCATION_PACK, EDUCATION_DOMAIN } from './education.js';
import { HEALTHCARE_PACK, HEALTHCARE_DOMAIN } from './healthcare.js';
import { FINANCE_PACK, FINANCE_DOMAIN } from './finance.js';
import { ENTERTAINMENT_PACK, ENTERTAINMENT_DOMAIN } from './entertainment.js';
import { ESPORTS_PACK, ESPORTS_DOMAIN } from './esports.js';
import { GAMING_PACK, GAMING_DOMAIN } from './gaming.js';
import { AI_ASSISTANT_PACK, AI_ASSISTANT_DOMAIN } from './aiAssistant.js';
import { SOCIAL_PACK, SOCIAL_DOMAIN } from './social.js';
import { MEDIA_PACK, MEDIA_DOMAIN } from './media.js';

import type { DomainPack, DomainModel } from './domainPackTypes.js';
import { toDomainModel } from './domainPackTypes.js';

export type { DomainPack, DomainModel, BusinessRulesSpec, DesignSpec, SecuritySpec, TestingSpec, TechnicalArchitectureDef, RegulatoryComplianceEntry, StateMachineDef } from './domainPackTypes.js';

export const domainPacks: DomainPack[] = [
  COFFEE_SHOP_PACK as DomainPack,
  ECOMMERCE_PACK as DomainPack,
  SAAS_PACK as DomainPack,
  LOGISTICS_PACK as DomainPack,
  BOOKING_PACK as DomainPack,
  PRODUCTIVITY_PACK as DomainPack,
  DEVELOPER_TOOLS_PACK as DomainPack,
  ENTERPRISE_PACK as DomainPack,
  JEWELLERY_PACK as DomainPack,
  MANUFACTURING_PACK as DomainPack,
  RESTAURANT_PACK as DomainPack,
  MARKETPLACE_PACK as DomainPack,
  EDUCATION_PACK as DomainPack,
  HEALTHCARE_PACK as DomainPack,
  FINANCE_PACK as DomainPack,
  ENTERTAINMENT_PACK as DomainPack,
  ESPORTS_PACK as DomainPack,
  GAMING_PACK as DomainPack,
  AI_ASSISTANT_PACK as DomainPack,
  SOCIAL_PACK as DomainPack,
  MEDIA_PACK as DomainPack,
];

export const domainModels: DomainModel[] = [
  COFFEE_SHOP_DOMAIN,
  ECOMMERCE_DOMAIN,
  SAAS_DOMAIN,
  LOGISTICS_DOMAIN,
  BOOKING_DOMAIN,
  PRODUCTIVITY_DOMAIN,
  DEVELOPER_TOOLS_DOMAIN,
  ENTERPRISE_DOMAIN,
  JEWELLERY_DOMAIN,
  MANUFACTURING_DOMAIN,
  RESTAURANT_DOMAIN,
  MARKETPLACE_DOMAIN,
  EDUCATION_DOMAIN,
  HEALTHCARE_DOMAIN,
  FINANCE_DOMAIN,
  ENTERTAINMENT_DOMAIN,
  ESPORTS_DOMAIN,
  GAMING_DOMAIN,
  AI_ASSISTANT_DOMAIN,
  SOCIAL_DOMAIN,
  MEDIA_DOMAIN,
];

export const coffeeShopDomain = COFFEE_SHOP_DOMAIN;
export const ecommerceDomain = ECOMMERCE_DOMAIN;
export const saasDomain = SAAS_DOMAIN;
export const manufacturingDomain = MANUFACTURING_DOMAIN;
export const jewelleryDomain = JEWELLERY_DOMAIN;
export const restaurantDomain = RESTAURANT_DOMAIN;
export const marketplaceDomain = MARKETPLACE_DOMAIN;
export const educationDomain = EDUCATION_DOMAIN;
export const healthcareDomain = HEALTHCARE_DOMAIN;
export const financeDomain = FINANCE_DOMAIN;
export const entertainmentDomain = ENTERTAINMENT_DOMAIN;
export const esportsDomain = ESPORTS_DOMAIN;
export const gamingDomain = GAMING_DOMAIN;
export const aiAssistantDomain = AI_ASSISTANT_DOMAIN;
export const socialDomain = SOCIAL_DOMAIN;
export const mediaDomain = MEDIA_DOMAIN;
export const logisticsDomain = LOGISTICS_DOMAIN;
export const bookingDomain = BOOKING_DOMAIN;
export const productivityDomain = PRODUCTIVITY_DOMAIN;
export const developerToolsDomain = DEVELOPER_TOOLS_DOMAIN;
export const enterpriseDomain = ENTERPRISE_DOMAIN;

// Pack registry
export const DOMAIN_PACKS: Record<string, DomainPack> = {
  coffee_shop: COFFEE_SHOP_PACK as DomainPack,
  ecommerce: ECOMMERCE_PACK as DomainPack,
  saas: SAAS_PACK as DomainPack,
};

const DOMAIN_MODELS: Record<string, DomainModel> = {
  coffee_shop: COFFEE_SHOP_DOMAIN,
  ecommerce: ECOMMERCE_DOMAIN,
  saas: SAAS_DOMAIN,
};

export function getPack(domainId: string): DomainPack {
  const pack = DOMAIN_PACKS[domainId];
  if (!pack) {
    throw new Error(
      `Unknown domain pack: "${domainId}". Available: ${Object.keys(DOMAIN_PACKS).join(', ')}`
    );
  }
  return pack;
}

export function getModel(domainId: string): DomainModel {
  const model = DOMAIN_MODELS[domainId];
  if (!model) {
    throw new Error(
      `Unknown domain model: "${domainId}". Available: ${Object.keys(DOMAIN_MODELS).join(', ')}`
    );
  }
  return model;
}

export function getAllPackIds(): string[] {
  return Object.keys(DOMAIN_PACKS);
}

export function getAllPacks(): DomainPack[] {
  return Object.values(DOMAIN_PACKS);
}

export function getAllModels(): DomainModel[] {
  return Object.values(DOMAIN_MODELS);
}

export function hasPack(domainId: string): boolean {
  return domainId in DOMAIN_PACKS;
}

export function getPackSummaries(): { domain: string; name: string; description: string }[] {
  return Object.values(DOMAIN_PACKS).map((pack) => ({
    domain: pack.domain,
    name: pack.name,
    description: pack.description,
  }));
}

export function validatePack(pack: DomainPack): string[] {
  const errors: string[] = [];
  const requiredUniversal = ['domain', 'name', 'description', 'businessRules', 'design', 'security', 'testing'];
  for (const field of requiredUniversal) {
    if (!(field in pack)) errors.push(`Missing required field: ${field}`);
  }
  if ((pack as any).catalog) {
    const c = (pack as any).catalog;
    if (!Array.isArray(c.categories) || c.categories.length < 3) errors.push('Catalog must have at least 3 categories');
    if (!Array.isArray(c.features) || c.features.length < 10) errors.push('Catalog must have at least 10 features');
  }
  if ((pack as any).fulfillment) {
    const f = (pack as any).fulfillment;
    if (Array.isArray(f.modes) && f.modes.length < 1) errors.push('Fulfillment must have at least one mode');
  }
  if ((pack as any).components) {
    const componentGroups = ['public', 'customer', 'admin', 'staff'] as const;
    for (const group of componentGroups) {
      const items = ((pack as any).components as Record<string, string[]>)[group];
      if (!Array.isArray(items) || items.length < 1) errors.push(`Components.${group} must have at least 1 component`);
    }
  }
  const ruleKeys = Object.keys((pack as any).businessRules);
  if (ruleKeys.length < 5) errors.push(`Business rules must have at least 5 rules (found ${ruleKeys.length})`);
  if (typeof (pack as any).security.auth !== 'string' || (pack as any).security.auth.length === 0) {
    errors.push('Security must define auth requirements');
  }
  if (typeof (pack as any).security.data !== 'string' || (pack as any).security.data.length === 0) {
    errors.push('Security must define data requirements');
  }
  if (!Array.isArray((pack as any).security.compliance) || (pack as any).security.compliance.length < 1) {
    errors.push('Security must define at least 1 compliance requirement');
  }
  const testTypes = ['unit', 'integration', 'e2e'] as const;
  for (const type of testTypes) {
    const tests = ((pack as any).testing as Record<string, string[]>)[type];
    if (!Array.isArray(tests) || tests.length < 1) errors.push(`Testing must have at least 1 ${type} test case`);
  }
  if (pack.design && Object.keys(pack.design).length < 4) {
    errors.push(`Design must have at least 4 principle categories (found ${Object.keys(pack.design).length})`);
  }
  return errors;
}
