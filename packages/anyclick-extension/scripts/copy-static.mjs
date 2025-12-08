#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const staticDir = join(root, "static");

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "devtools.html",
  "panel.html",
  "inspector.html",
];

for (const file of staticFiles) {
  const src = join(staticDir, file);
  const dest = join(distDir, file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}

// Copy icons
const iconsDir = join(staticDir, "icons");
const distIconsDir = join(distDir, "icons");
if (existsSync(iconsDir)) {
  if (!existsSync(distIconsDir)) {
    mkdirSync(distIconsDir, { recursive: true });
  }
  const iconSizes = ["16", "48", "128"];
  for (const size of iconSizes) {
    const iconFile = `icon${size}.png`;
    const src = join(iconsDir, iconFile);
    const dest = join(distIconsDir, iconFile);
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`Copied icons/${iconFile} to dist/icons/`);
    }
  }
}

console.log("Static files copied successfully!");
