#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const nextDir = path.join(__dirname, "..", ".next");
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("Cleaned .next");
  }
} catch (e) {
  console.error("Clean failed:", e.message);
  process.exit(1);
}
