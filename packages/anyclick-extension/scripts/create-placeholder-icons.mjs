#!/usr/bin/env node
/**
 * Creates placeholder PNG icons for the extension.
 * These should be replaced with proper branded icons before store submission.
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "static", "icons");

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid PNG data (1x1 blue pixel) encoded in base64
// We'll use this as a placeholder - replace with real icons
const minimalPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==",
  "base64",
);

// Create placeholder icons of different sizes
// Note: These are all 1x1 pixel placeholders - replace before publishing
const sizes = [16, 48, 64, 128];

for (const size of sizes) {
  const iconPath = join(iconsDir, `icon${size}.png`);
  writeFileSync(iconPath, minimalPNG);
  console.log(`Created placeholder icon: icon${size}.png`);
}

console.log("\n⚠️  These are 1x1 pixel placeholders.");
console.log("   Replace with proper icons before Chrome Web Store submission.");
