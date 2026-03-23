/**
 * Generates .ts locale modules from JSON files.
 * Avoids Turbopack HMR "Expected module to match pattern" error with JSON imports.
 * Run: node scripts/generate-locales.js
 */
const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "../src/config/locales");
const ukJson = JSON.parse(fs.readFileSync(path.join(localesDir, "uk.json"), "utf-8"));
const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf-8"));

const header = "/** Auto-generated from *.json - run: node scripts/generate-locales.js */\n\n";
const ukTs = header + "export const uk = " + JSON.stringify(ukJson, null, 2) + " as Record<string, unknown>;\n";
const enTs = header + "export const en = " + JSON.stringify(enJson, null, 2) + " as Record<string, unknown>;\n";

fs.writeFileSync(path.join(localesDir, "uk.generated.ts"), ukTs, "utf-8");
fs.writeFileSync(path.join(localesDir, "en.generated.ts"), enTs, "utf-8");

console.log("Generated uk.generated.ts and en.generated.ts");
