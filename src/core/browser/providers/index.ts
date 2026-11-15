/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Public API
 * (src/core/browser/providers/index.ts)
 *
 * Re-exports the browser provider interface and implementations.
 */

export {
  // Abstract interface and types
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
} from './browserProvider.js';

export { PlaywrightProvider } from './playwrightProvider.js';
