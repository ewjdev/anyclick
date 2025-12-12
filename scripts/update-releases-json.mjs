#!/usr/bin/env node

/**
 * Script to update releases.json with new release information.
 * Run after changesets publish to keep the roadmap timeline in sync.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const RELEASES_JSON_PATH = join(
  ROOT_DIR,
  "apps/web/src/data/releases.json"
);
const PACKAGES_DIR = join(ROOT_DIR, "packages");

// Package name mapping
const PACKAGE_PREFIXES = "@ewjdev/";
const PACKAGE_DIRS = [
  "anyclick-core",
  "anyclick-react",
  "anyclick-pointer",
  "anyclick-github",
  "anyclick-cursor",
  "anyclick-cursor-local",
  "anyclick-devtools",
  "anyclick-adapters",
];

/**
 * Parse a CHANGELOG.md file to extract release entries
 */
function parseChangelog(changelogPath) {
  if (!existsSync(changelogPath)) return [];

  const content = readFileSync(changelogPath, "utf-8");
  const releases = [];

  // Match version headings like ## 1.4.0
  const versionRegex = /^## (\d+\.\d+\.\d+)\s*$/gm;
  let match;

  while ((match = versionRegex.exec(content)) !== null) {
    const version = match[1];
    const startIndex = match.index + match[0].length;

    // Find the next version heading or end of file
    const nextMatch = versionRegex.exec(content);
    const endIndex = nextMatch ? nextMatch.index : content.length;
    versionRegex.lastIndex = match.index + match[0].length; // Reset to continue from where we were

    const sectionContent = content.slice(startIndex, endIndex).trim();

    // Determine release type from the section content
    let type = "patch";
    if (sectionContent.includes("### Major Changes")) {
      type = "major";
    } else if (sectionContent.includes("### Minor Changes")) {
      type = "minor";
    }

    // Extract summary (first meaningful line after type heading)
    let summary = "";
    const lines = sectionContent.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      if (
        line.startsWith("###") ||
        line.startsWith("-") ||
        line.includes("Updated dependencies")
      ) {
        if (line.startsWith("- ") && !line.includes("Updated dependencies")) {
          summary = line.replace(/^-\s*/, "").replace(/^\w+:\s*/, "").trim();
          // Remove commit hash prefix like "7942892: "
          summary = summary.replace(/^[a-f0-9]+:\s*/i, "");
          break;
        }
        continue;
      }
    }

    releases.push({
      version,
      type,
      summary: summary || `Version ${version}`,
    });
  }

  return releases;
}

/**
 * Get current version from package.json
 */
function getPackageVersion(packageDir) {
  const pkgPath = join(PACKAGES_DIR, packageDir, "package.json");
  if (!existsSync(pkgPath)) return null;

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

/**
 * Generate a unique release ID
 */
function generateReleaseId(version, packages) {
  const shortPkg = packages[0]
    .replace(PACKAGE_PREFIXES, "")
    .replace("anyclick-", "");
  return `anyclick-${version}`;
}

/**
 * Main function to update releases.json
 */
function updateReleasesJson() {
  console.log("📦 Updating releases.json...");

  // Read current releases.json
  let releasesData;
  try {
    releasesData = JSON.parse(readFileSync(RELEASES_JSON_PATH, "utf-8"));
  } catch (error) {
    console.error("❌ Failed to read releases.json:", error.message);
    process.exit(1);
  }

  const existingVersions = new Set(
    releasesData.releases.map((r) => r.version)
  );

  // Collect all versions from all packages
  const allVersions = new Map(); // version -> { packages, type, summary, date }

  for (const packageDir of PACKAGE_DIRS) {
    const pkgName = `${PACKAGE_PREFIXES}${packageDir}`;
    const changelogPath = join(PACKAGES_DIR, packageDir, "CHANGELOG.md");
    const releases = parseChangelog(changelogPath);

    for (const release of releases) {
      if (existingVersions.has(release.version)) continue;

      if (!allVersions.has(release.version)) {
        allVersions.set(release.version, {
          packages: [],
          type: release.type,
          summary: release.summary,
          date: new Date().toISOString().split("T")[0], // Today's date
        });
      }

      const existing = allVersions.get(release.version);
      existing.packages.push(pkgName);

      // Use the highest priority type (major > minor > patch)
      const typePriority = { major: 3, minor: 2, patch: 1 };
      if (typePriority[release.type] > typePriority[existing.type]) {
        existing.type = release.type;
        existing.summary = release.summary;
      }
    }
  }

  // Convert to release entries
  const newReleases = [];
  for (const [version, data] of allVersions) {
    // Determine era - new releases are "today"
    const era = "today";

    // Move current "today" releases to "past" if we have new ones
    // Move current "today" releases to "past" if we have new ones
    if (allVersions.size > 0) {
      for (const existing of releasesData.releases) {
        if (existing.era === "today") {
          existing.era = "past";
        }
      }
    }

    const release = {
      id: generateReleaseId(version, data.packages),
      packages: data.packages.sort(),
      version,
      type: data.type,
      date: data.date,
      summary: data.summary,
      details: `Release of version ${version} with ${data.type} changes.`,
      highlights: [],
      npmLink: `https://www.npmjs.com/package/${data.packages[0]}`,
      era,
    };

    newReleases.push(release);
  }

  if (newReleases.length === 0) {
    console.log("✅ No new releases to add.");
    return;
  }

  // Sort new releases by version (semver-ish)
  newReleases.sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.version.split(".").map(Number);
    const [bMajor, bMinor, bPatch] = b.version.split(".").map(Number);
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  });

  // Add new releases
  releasesData.releases.push(...newReleases);

  // Sort all releases by version
  releasesData.releases.sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.version.split(".").map(Number);
    const [bMajor, bMinor, bPatch] = b.version.split(".").map(Number);
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  });

  // Update current version to the latest
  const latestVersion = releasesData.releases[releasesData.releases.length - 1].version;
  releasesData.currentVersion = latestVersion;
  releasesData.lastUpdated = new Date().toISOString().split("T")[0];

  // Write updated releases.json
  writeFileSync(
    RELEASES_JSON_PATH,
    JSON.stringify(releasesData, null, 2) + "\n"
  );

  console.log(`✅ Added ${newReleases.length} new release(s):`);
  for (const release of newReleases) {
    console.log(`   - v${release.version} (${release.type}): ${release.summary}`);
  }
}

// Run
updateReleasesJson();


















