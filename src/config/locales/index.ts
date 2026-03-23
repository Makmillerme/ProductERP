/**
 * Locale messages loader.
 * Uses generated .ts files to avoid Turbopack HMR "Expected module to match pattern" error with JSON imports.
 * Run `node scripts/generate-locales.js` after editing uk.json or en.json.
 */
export { uk } from "./uk.generated";
export { en } from "./en.generated";
