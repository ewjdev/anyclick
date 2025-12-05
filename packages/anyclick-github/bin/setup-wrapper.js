#!/usr/bin/env node

/**
 * Wrapper script that conditionally runs setup-media-branch.js
 * Only runs if GITHUB_TOKEN is configured, otherwise shows a warning
 */

const path = require("path");
const fs = require("fs");

// Load environment variables from .env.local files
function loadEnvFiles() {
  // Try to load dotenv if available
  let dotenv;
  try {
    dotenv = require("dotenv");
  } catch {
    dotenv = null;
  }

  // Locations to check for .env.local files
  const envPaths = [
    path.resolve(__dirname, "../../../.env.local"),
    path.resolve(__dirname, "../../../apps/web/.env.local"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      if (dotenv) {
        dotenv.config({ path: envPath, override: true });
      } else {
        // Manual parsing fallback
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
              let value = valueParts.join("=");
              // Remove quotes if present
              if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
              ) {
                value = value.slice(1, -1);
              }
              process.env[key.trim()] = value;
            }
          }
        }
      }
    }
  }
}

// Load env files
loadEnvFiles();

// Check if GitHub token is configured
const hasGitHubToken = !!(process.env.GITHUB_TOKEN);
const hasGitHubRepo = !!(process.env.GITHUB_REPO);

if (!hasGitHubToken || !hasGitHubRepo) {
  console.log("\n⚠️  GitHub adapter setup skipped");
  console.log(
    "   GITHUB_TOKEN and/or GITHUB_REPO not configured in environment variables."
  );
  console.log("\n💡 To enable GitHub integration:");
  console.log("   1. Create a GitHub Personal Access Token");
  console.log("   2. Add to .env.local:");
  console.log("      GITHUB_TOKEN=ghp_xxxxxxxxxxxx");
  console.log("      GITHUB_REPO=owner/repository");
  console.log(
    "   3. Run: npx @ewjdev/anyclick-github setup-media-branch\n"
  );
  process.exit(0);
}

// GitHub is configured, run the actual setup script
console.log("✓ GitHub token found, running media branch setup...\n");
require("./setup-media-branch.js");

