/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Industry Specifications Registry
 *
 * Re-exports all industry spec getters and provides the lookup table.
 */

export {
  getEcommerceSpec,
  getFoodBeverageSpec,
  getHealthcareSpec,
  getAiPlatformSpec,
  getBookingSpec,
  getFintechSpec,
  getEducationSpec,
  getEntertainmentSpec,
  getLogisticsSpec,
  getHospitalitySpec,
  getRealEstateSpec,
  getAutomotiveSpec,
} from './industrySpecParts.js';

import type { ProjectSpec } from './types.js';

export type IndustryKey =
  | 'ecommerce'
  | 'food-beverage'
  | 'healthcare'
  | 'ai-platform'
  | 'booking'
  | 'fintech'
  | 'education'
  | 'entertainment'
  | 'logistics'
  | 'hospitality'
  | 'real-estate'
  | 'automotive';

export interface IndustryRegistryEntry {
  key: IndustryKey;
  displayName: string;
  description: string;
  getSpec: () => ProjectSpec;
  competitorExamples: string[];
}

export const INDUSTRY_REGISTRY: IndustryRegistryEntry[] = [
  { key:'ecommerce', displayName:'E-Commerce', description:'Online retail and marketplace platforms', getSpec: () => require('./industrySpecParts.js').getEcommerceSpec(), competitorExamples:['Amazon','Shopify','WooCommerce'] },
  { key:'food-beverage', displayName:'Food & Beverage', description:'Food delivery and restaurant platforms', getSpec: () => require('./industrySpecParts.js').getFoodBeverageSpec(), competitorExamples:['DoorDash','UberEats','GrubHub'] },
  { key:'healthcare', displayName:'Healthcare', description:'Medical records, telemedicine, patient portals', getSpec: () => require('./industrySpecParts.js').getHealthcareSpec(), competitorExamples:['Epic','Cerner','Teladoc'] },
  { key:'ai-platform', displayName:'AI Platform', description:'LLM APIs, AI playgrounds, model platforms', getSpec: () => require('./industrySpecParts.js').getAiPlatformSpec(), competitorExamples:['OpenAI','Anthropic','HuggingFace'] },
  { key:'booking', displayName:'Booking & Reservation', description:'Property and experience booking platforms', getSpec: () => require('./industrySpecParts.js').getBookingSpec(), competitorExamples:['Airbnb','Booking.com','Expedia'] },
  { key:'fintech', displayName:'Fintech', description:'Digital banking, payments, financial services', getSpec: () => require('./industrySpecParts.js').getFintechSpec(), competitorExamples:['Stripe','PayPal','Revolut'] },
  { key:'education', displayName:'Education', description:'Online learning and course platforms', getSpec: () => require('./industrySpecParts.js').getEducationSpec(), competitorExamples:['Coursera','Udemy','Khan Academy'] },
  { key:'entertainment', displayName:'Entertainment & Media', description:'Video/audio streaming platforms', getSpec: () => require('./industrySpecParts.js').getEntertainmentSpec(), competitorExamples:['Netflix','Spotify','Disney+'] },
  { key:'logistics', displayName:'Logistics & Shipping', description:'Package tracking and delivery platforms', getSpec: () => require('./industrySpecParts.js').getLogisticsSpec(), competitorExamples:['FedEx','UPS','DHL'] },
  { key:'hospitality', displayName:'Hospitality', description:'Hotel booking and guest management', getSpec: () => require('./industrySpecParts.js').getHospitalitySpec(), competitorExamples:['Marriott','Hilton','Hyatt'] },
  { key:'real-estate', displayName:'Real Estate', description:'Property listings and real estate platforms', getSpec: () => require('./industrySpecParts.js').getRealEstateSpec(), competitorExamples:['Zillow','Realtor.com','Redfin'] },
  { key:'automotive', displayName:'Automotive', description:'Vehicle sales, trade-ins, and service platforms', getSpec: () => require('./industrySpecParts.js').getAutomotiveSpec(), competitorExamples:['Carvana','Autotrader','Tesla'] },
];

export const INDUSTRY_DISPLAY_NAMES: Record<IndustryKey, string> = Object.fromEntries(
  INDUSTRY_REGISTRY.map(e => [e.key, e.displayName])
) as Record<IndustryKey, string>;

export function getIndustrySpec(industry: string): ProjectSpec {
  const entry = INDUSTRY_REGISTRY.find(e => e.key === industry);
  if (!entry) throw new Error(`Unknown industry: ${industry}. Available: ${INDUSTRY_REGISTRY.map(e => e.key).join(', ')}`);
  return entry.getSpec();
}

export function listIndustries(): { key: string; name: string; description: string }[] {
  return INDUSTRY_REGISTRY.map(e => ({ key: e.key, name: e.displayName, description: e.description }));
}
