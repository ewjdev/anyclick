#!/usr/bin/env node

/**
 * CLI script to create the media branch for storing feedback assets
 *
 * Usage:
 *   npx @ewjdev/anyclick-github setup-media-branch
 *
 * Environment variables:
 *   GITHUB_TOKEN - GitHub personal access token with repo scope
 *   GITHUB_REPO  - Repository name
 *
 * Or via CLI args:
 *   --token, -t  - GitHub token
 *   --owner, -o  - Repository owner
 *   --repo, -r   - Repository name
 *   --branch, -b - Branch name (default: issues/src)
 *   --help, -h   - Show help
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
    // dotenv not installed, try to manually parse .env files
    dotenv = null;
  }

  // Locations to check for .env.local files (in priority order, later overrides earlier)
  const envPaths = [
    // Root monorepo .env.local
    path.resolve(__dirname, "../../../.env.local"),
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

// Load env files before parsing args
loadEnvFiles();

const DEFAULT_BRANCH = "issues/src";
const DEFAULT_API_URL = "https://api.github.com";

function parseArgs() {
  const args = process.argv.slice(2);
  const repoName = process.env.GITHUB_REPO || "";
  const [owner, repo] = repoName.split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPO is not set or is not in the correct format");
  }
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner,
    repo,
    branch: DEFAULT_BRANCH,
    apiBaseUrl: DEFAULT_API_URL,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--token":
      case "-t":
        config.token = nextArg;
        i++;
        break;
      case "--owner":
      case "-o":
        config.owner = nextArg;
        i++;
        break;
      case "--repo":
      case "-r":
        config.repo = nextArg;
        i++;
        break;
      case "--branch":
      case "-b":
        config.branch = nextArg;
        i++;
        break;
      case "--api-url":
        config.apiBaseUrl = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        config.help = true;
        break;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
@ewjdev/anyclick-github - Setup Media Branch

Creates an orphan branch for storing feedback screenshots and assets.

Usage:
  npx @ewjdev/anyclick-github setup-media-branch [options]

Options:
  -t, --token <token>    GitHub personal access token (or GITHUB_TOKEN env)
  -r, --repo <repo>      Repository name (or GITHUB_REPO env)
  -b, --branch <branch>  Branch name (default: ${DEFAULT_BRANCH})
  --api-url <url>        GitHub API base URL (for Enterprise)
  -h, --help             Show this help message

Examples:
  # Using environment variables
  GITHUB_TOKEN=ghp_xxx GITHUB_REPO=owner/myrepo npx @ewjdev/anyclick-github setup-media-branch

  # Using CLI arguments
  npx @ewjdev/anyclick-github setup-media-branch -t ghp_xxx -o myorg -r myrepo

  # Custom branch name
  npx @ewjdev/anyclick-github setup-media-branch -b feedback-assets
`);
}

async function checkBranchExists(config) {
  const url = `${config.apiBaseUrl}/repos/${config.owner}/${config.repo}/git/ref/heads/${config.branch}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return response.ok;
}

async function createOrphanBranch(config) {
  // Step 1: Create a blob with a README file
  const readmeContent = `# Feedback Assets

This branch stores screenshot assets for GitHub Issues created by [@ewjdev/anyclick-github](https://www.npmjs.com/package/@ewjdev/anyclick-github).

## Structure

\`\`\`
feedback-assets/
└── <submission-id>/
    ├── element.png     # Screenshot of the selected element
    ├── container.png   # Screenshot of the element's container
    └── viewport.png    # Full viewport screenshot
\`\`\`

## Note

This is an orphan branch with no connection to the main codebase. Assets are automatically managed by the anyclick feedback system.

Do not manually edit this branch unless cleaning up old assets.
`;

  console.log("📝 Creating blob for README...");
  const url = `${config.apiBaseUrl}/repos/${config.owner}/${config.repo}/git/blobs`;
  console.log("🔍 Creating blob for README at URL:", url);
  const blobResponse = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      content: Buffer.from(readmeContent).toString("base64"),
      encoding: "utf-8",
    }),
  });

  if (!blobResponse.ok) {
    const error = await blobResponse.text();
    console.log("🔍 Blob response:", error);
    throw new Error(`Failed to create blob: ${blobResponse.status} - ${error}`);
  }

  const blob = await blobResponse.json();
  console.log(`   ✓ Blob created: ${blob.sha.substring(0, 7)}`);

  // Step 2: Create a tree with the README
  console.log("🌳 Creating tree...");
  const treeResponse = await fetch(
    `${config.apiBaseUrl}/repos/${config.owner}/${config.repo}/git/trees`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tree: [
          {
            path: "README.md",
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          },
        ],
      }),
    },
  );

  if (!treeResponse.ok) {
    const error = await treeResponse.text();
    throw new Error(`Failed to create tree: ${treeResponse.status} - ${error}`);
  }

  const tree = await treeResponse.json();
  console.log(`   ✓ Tree created: ${tree.sha.substring(0, 7)}`);

  // Step 3: Create an orphan commit (no parents)
  console.log("📦 Creating orphan commit...");
  const commitResponse = await fetch(
    `${config.apiBaseUrl}/repos/${config.owner}/${config.repo}/git/commits`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          "Initialize feedback assets branch\n\nCreated by @ewjdev/anyclick-github setup-media-branch",
        tree: tree.sha,
        parents: [], // Empty parents = orphan commit
      }),
    },
  );

  if (!commitResponse.ok) {
    const error = await commitResponse.text();
    throw new Error(
      `Failed to create commit: ${commitResponse.status} - ${error}`,
    );
  }

  const commit = await commitResponse.json();
  console.log(`   ✓ Commit created: ${commit.sha.substring(0, 7)}`);

  // Step 4: Create the branch reference
  console.log(`🔗 Creating branch '${config.branch}'...`);
  const refResponse = await fetch(
    `${config.apiBaseUrl}/repos/${config.owner}/${config.repo}/git/refs`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${config.branch}`,
        sha: commit.sha,
      }),
    },
  );

  if (!refResponse.ok) {
    const error = await refResponse.text();
    throw new Error(`Failed to create ref: ${refResponse.status} - ${error}`);
  }

  console.log(`   ✓ Branch '${config.branch}' created successfully!`);
  return commit.sha;
}

async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Validate required config
  const missing = [];
  if (!config.token) missing.push("token (--token or GITHUB_TOKEN)");
  if (!config.repo) missing.push("repo (--repo or GITHUB_REPO)");

  if (missing.length > 0) {
    console.error("❌ Missing required configuration:");
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error("\nRun with --help for usage information.");
    process.exit(1);
  }

  console.log(
    `\n🚀 Setting up media branch for ${config.owner}/${config.repo}`,
  );
  console.log(`   Branch: ${config.branch}\n`);

  try {
    // Check if branch already exists
    console.log("🔍 Checking if branch exists...");
    const exists = await checkBranchExists(config);

    if (exists) {
      console.log(`\n✅ Branch '${config.branch}' already exists!`);
      console.log("   No action needed.");
      process.exit(0);
    }

    console.log(`   Branch does not exist, creating...\n`);

    // Create the orphan branch
    await createOrphanBranch(config);

    console.log(`\n✅ Setup complete!`);
    console.log(`\n📋 Next steps:`);
    console.log(
      `   1. Configure your adapter with mediaBranch: '${config.branch}'`,
    );
    console.log(
      `   2. Screenshots will be uploaded to this branch automatically`,
    );
    console.log(
      `\n🔗 View branch: https://github.com/${config.owner}/${config.repo}/tree/${config.branch}`,
    );
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
