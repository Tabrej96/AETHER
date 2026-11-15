/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Public API
 * (src/core/browser/index.ts)
 *
 * Re-exports all browser runtime modules: providers, session management,
 * isolation, automation bridge, and resource management.
 */

// Provider abstraction
export {
  type BrowserProvider,
  type BrowserLaunchOptions,
  type BrowserContextOptions,
  type NewPageOptions,
  type BrowserContextHandle,
  type PageHandle,
  type ScreenshotResult,
  type DomSnapshot,
  type A11yNode,
  type A11yTree,
  type NetworkRequest,
  type ConsoleMessage,
  type BrowserCookie,
  type BrowserViewport,
  type BrowserSessionHealth,
  type BrowserSessionState,
  type BrowserEngine,
  type BrowserFeature,
  type ProviderCapabilities,
  type CapabilityRequirement,
  type CapabilityNegotiationResult,
  type BrowserProviderFactory,
  type BrowserProviderError,
  type BrowserLaunchError,
  type BrowserNavigationError,
  type BrowserInteractionError,
  type BrowserTimeoutError,
  type BrowserResourceError,
  PlaywrightProvider,
} from './providers/browserProvider.js';

export {
  SessionManager,
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
  type SessionStatus,
  type ManagedSession,
  type SessionPoolStats,
  type SessionAcquireResult,
} from './sessionManager.js';

export {
  BrowserIsolation,
  DEFAULT_ISOLATION_CONFIG,
  createIsolationProfile,
  type IsolationProfile,
  type IsolatedTask,
  type IsolationResult,
  type CleanupReport,
  type IsolationConfig,
} from './browserIsolation.js';

export {
  AutomationBridge,
  DEFAULT_BRIDGE_CONFIG,
  CommandNormalizer,
  type AutomationBridgeConfig,
  type BridgeCommand,
  type BridgeCommandOptions,
  type BridgeResult,
} from './automationBridge.js';

export {
  ResourceManager,
  DEFAULT_RESOURCE_MANAGER_CONFIG,
  DEFAULT_RESOURCE_THRESHOLDS,
  type ResourceManagerConfig,
  type ResourceThresholds,
  type ResourceMetrics,
  type ResourceAlert,
  type ResourceAlertSeverity,
  type ResourceHealthSummary,
} from './resourceManager.js';
