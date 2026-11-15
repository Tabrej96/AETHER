/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 - DOMAIN INTELLIGENCE ENGINE
 * (src/core/intel/domainIntelligence.ts) - Created by Tabrej
 *
 * Re-exports from domainPacks/ to satisfy imports from domainPacks.ts.
 */

import { toDomainModel, DOMAIN_PACKS } from './domainPacks/index.js';

export type { DomainModel } from './domainPacks/index.js';

const _makeDomain = (id: string) => toDomainModel(DOMAIN_PACKS[id] as any);

export const coffeeShopDomain = _makeDomain('coffee_shop');
export const ecommerceDomain = _makeDomain('ecommerce');
export const saasDomain = _makeDomain('saas');
export const manufacturingDomain = _makeDomain('manufacturing');
export const jewelleryDomain = _makeDomain('jewellery');
export const restaurantDomain = _makeDomain('restaurant');
export const marketplaceDomain = _makeDomain('marketplace');
export const educationDomain = _makeDomain('education');
export const healthcareDomain = _makeDomain('healthcare');
export const financeDomain = _makeDomain('finance');
export const entertainmentDomain = _makeDomain('entertainment');
export const esportsDomain = _makeDomain('esports');
export const gamingDomain = _makeDomain('gaming');
export const aiAssistantDomain = _makeDomain('ai_assistant');
export const socialDomain = _makeDomain('social');
export const mediaDomain = _makeDomain('media');
export const logisticsDomain = _makeDomain('logistics');
export const bookingDomain = _makeDomain('booking');
export const productivityDomain = _makeDomain('productivity');
export const developerToolsDomain = _makeDomain('developer_tools');
export const enterpriseDomain = _makeDomain('enterprise');
