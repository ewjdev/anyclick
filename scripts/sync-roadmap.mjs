#!/usr/bin/env node

/**
 * Roadmap Sync Script
 * 
 * Syncs roadmap items from GitHub issues/PRs and plan files to:
 * - docs/roadmap.md (markdown format)
 * - apps/web/src/data/roadmap-items.json (JSON for React page)
 * 
 * Usage:
 *   node scripts/sync-roadmap.mjs [options]
 * 
 * Options:
 *   --dry-run    Preview changes without writing files
 *   --verbose    Show detailed output
 *   --json-only  Only update JSON file
 *   --md-only    Only update markdown file
 */

import {
  loadConfig,
  fetchGitHubIssues,
  parsePlanFiles,
  assignEras,
  deduplicateItems,
  generateRoadmapJson,
  generateRoadmapMarkdown,
  writeRoadmapJson,
  writeRoadmapMarkdown,
  readExistingMarkdown,
  generateSyncReport,
  loadExistingItems,
  loadExistingData,
  mergeWithExistingItems
} from './roadmap-utils.mjs';

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    jsonOnly: args.includes('--json-only'),
    mdOnly: args.includes('--md-only'),
    help: args.includes('--help') || args.includes('-h')
  };
}

/**
 * Print usage information
 */
function printHelp() {
  console.log(`
Roadmap Sync Script

Syncs roadmap items from GitHub issues/PRs and plan files.

Usage:
  node scripts/sync-roadmap.mjs [options]

Options:
  --dry-run    Preview changes without writing files
  --verbose    Show detailed output
  --json-only  Only update JSON file
  --md-only    Only update markdown file
  --help, -h   Show this help message

Environment Variables:
  GITHUB_TOKEN   GitHub personal access token for API access

Configuration:
  The script reads configuration from .cursor/config/roadmap.json

Output Files:
  - docs/roadmap.md
  - apps/web/src/data/roadmap-items.json
`);
}

/**
 * Main sync function
 */
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  
  console.log('🚀 Starting roadmap sync...\n');
  
  const stats = {
    newItems: 0,
    updatedItems: 0,
    errors: []
  };
  
  try {
    // Load configuration
    if (args.verbose) console.log('Loading configuration...');
    const config = await loadConfig();
    if (args.verbose) console.log('Config loaded:', JSON.stringify(config, null, 2));
    
    // Fetch GitHub items
    console.log('Fetching GitHub issues/PRs...');
    const token = process.env.GITHUB_TOKEN;
    const githubItems = await fetchGitHubIssues(config, token);
    console.log(`  Found ${githubItems.length} GitHub items`);
    
    // Parse plan files
    console.log('Parsing plan files...');
    const planItems = await parsePlanFiles(config);
    console.log(`  Found ${planItems.length} plan items`);
    
    // Load existing data to preserve manual entries and roles
    console.log('Loading existing data...');
    const existingData = await loadExistingData(config.output.jsonPath);
    const existingItems = existingData.items || [];
    console.log(`  Found ${existingItems.length} existing items (${existingItems.filter(i => i.source === 'manual').length} manual)`);
    
    // Merge synced items with existing (preserving manual items)
    let allItems = [...githubItems, ...planItems];
    if (args.verbose) {
      console.log('\nSynced items before processing:');
      for (const item of allItems) {
        console.log(`  - [${item.source}] ${item.title} (era: ${item.era || 'none'})`);
      }
    }
    
    // Deduplicate synced items first
    console.log('Deduplicating synced items...');
    allItems = deduplicateItems(allItems);
    console.log(`  ${allItems.length} unique synced items`);
    
    // Merge with existing manual items
    console.log('Merging with existing manual items...');
    allItems = mergeWithExistingItems(allItems, existingItems);
    console.log(`  ${allItems.length} total items after merge`);
    
    // Assign eras to items that don't have one
    console.log('Assigning eras...');
    allItems = assignEras(allItems, config);
    
    // Generate outputs
    console.log('Generating outputs...\n');
    
    // Generate JSON
    if (!args.mdOnly) {
      const jsonData = generateRoadmapJson(allItems, existingData);
      
      if (args.dryRun) {
        console.log('JSON output (dry run):');
        console.log(JSON.stringify(jsonData, null, 2).substring(0, 1000) + '...\n');
      } else {
        await writeRoadmapJson(jsonData, config.output.jsonPath);
      }
    }
    
    // Generate Markdown
    if (!args.jsonOnly) {
      const existingMd = await readExistingMarkdown(config.output.markdownPath);
      const mdContent = generateRoadmapMarkdown(allItems, existingMd);
      
      if (args.dryRun) {
        console.log('Markdown output (dry run):');
        console.log(mdContent.substring(0, 1000) + '...\n');
      } else {
        await writeRoadmapMarkdown(mdContent, config.output.markdownPath);
      }
    }
    
    // Generate and print report
    const report = generateSyncReport(allItems, stats);
    console.log(report);
    
    if (args.dryRun) {
      console.log('ℹ️  Dry run complete. No files were modified.\n');
    } else {
      console.log('✅ Roadmap sync complete!\n');
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error.message);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();

