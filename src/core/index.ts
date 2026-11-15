/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Engineering Engine — Core Module Index
 *
 * Central export point for all product engineering modules.
 */

// Core types
export * from './types';

// Existing AETHER engines
export * from './swarmEngine';
export * from './adversarialEngine';
export * from './contextEngine';
export * from './continuityEngine';
export * from './securityEngine';
export * from './memoryEngine';
export * from './validator';
export * from './autonomousRuntime';
export * from './selfImprovementEngine';

// Data catalog
export * from '../data/repositoryCatalog';

// =============================================================================
// NEW PRODUCT ENGINEERING MODULES
// =============================================================================

// Product Engineering Core — Product intelligence, planning, and requirements
export * from './productEngineering';

// Product Verification — Independent completeness verification
export * from './productVerification';

// Infrastructure Provisioning — Docker, CI/CD, environment setup
export * from './infrastructureProvisioning';

// Product Orchestrator — Main integration point
export * from './productOrchestrator';

// Competitive Benchmark — Benchmark experiment runner
export * from './competitiveBenchmark';
