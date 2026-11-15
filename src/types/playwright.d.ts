/**
 * Minimal Playwright ambient type declarations.
 * Playwright is an optional runtime dependency; these types allow the
 * PlaywrightProvider to type-check without requiring playwright in node_modules.
 */
declare module 'playwright' {
  // Empty ambient module declaration to satisfy TypeScript's module resolution.
  // Actual types come from our local interfaces.
}
