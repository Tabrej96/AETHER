/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared DomainPack type for the AETHER domain pack registry.
 */

export interface BusinessRulesSpec {
  [key: string]: unknown;
}

export interface DesignSpec {
  [key: string]: unknown;
}

export interface SecuritySpec {
  [key: string]: unknown;
}

export interface TestingSpec {
  [key: string]: unknown;
}

export interface TechnicalArchitectureDef {
  [key: string]: unknown;
}

export interface RegulatoryComplianceEntry {
  [key: string]: unknown;
}

export interface CatalogSpec {
  [key: string]: unknown;
}

export interface FulfillmentSpec {
  [key: string]: unknown;
}

export interface CustomerFeaturesSpec {
  [key: string]: unknown;
}

export interface OperationsFeaturesSpec {
  [key: string]: unknown;
}

export interface ExperienceFeaturesSpec {
  [key: string]: unknown;
}

export interface ComponentsSpec {
  [key: string]: string[];
}

export interface CategorySpec {
  [key: string]: unknown;
}

export interface DomainPack {
  [key: string]: unknown;
}

export interface DomainModel {
  [key: string]: unknown;
}

export interface UserRole {
  id: string;
  name: string;
  typicalFeatures: string[];
  permissions: string[];
}

export interface BusinessModel {
  modelType: string;
  revenueStreams: string[];
  costStructure: string[];
  pricingStrategy: string[];
}

export interface TechnicalPattern {
  category: string;
  name: string;
  description: string;
  rationale: string;
}

export interface OperationalLifecycleStage {
  id: string;
  name: string;
  description: string;
}

export interface DesignPrinciple {
  name: string;
  description: string;
}

export interface SecurityConsideration {
  category: string;
  name: string;
  description: string;
  severity: string;
}

export interface Regulation {
  name: string;
  requirements: string[];
}

export interface TestingRequirement {
  category: string;
  name: string;
  description: string;
  priority: string;
}

export interface StateMachineDef {
  entityName: string;
  states: string[];
  transitions: Record<string, string | string[]>;
  initialState: string;
  terminalStates: string[];
}
