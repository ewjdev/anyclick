/**
 * Roadmap Sync Utilities
 * 
 * Helper functions for syncing roadmap items from GitHub issues/PRs and plan files
 * to docs/roadmap.md and apps/web/src/data/roadmap-items.json
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Load and validate the roadmap configuration file
 * @param {string} configPath - Path to the configuration file
 * @returns {Promise<Object>} - The configuration object
 */
export async function loadConfig(configPath = '.cursor/config/roadmap.json') {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    // Validate required fields
    if (!config.github?.owner || !config.github?.repo) {
      throw new Error('Missing required github.owner or github.repo in config');
    }
    if (!config.output?.markdownPath || !config.output?.jsonPath) {
      throw new Error('Missing required output.markdownPath or output.jsonPath in config');
    }
    
    return config;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Config file not found at ${configPath}, using defaults`);
      return getDefaultConfig();
    }
    throw error;
  }
}

/**
 * Get default configuration
 * @returns {Object} - Default configuration object
 */
export function getDefaultConfig() {
  return {
    github: {
      owner: 'ewjdev',
      repo: 'anyclick',
      label: 'roadmap',
      titlePrefix: '[Roadmap]',
      eraLabels: {
        'short-term': ['short-term', 'next-up'],
        'mid-term': ['mid-term'],
        'later': ['later', 'future']
      }
    },
    plans: {
      directory: '.cursor/plans',
      metadataKey: 'roadmap',
      metadataValue: true,
      includeTodos: true
    },
    eras: {
      autoAssign: true,
      defaultEra: 'mid-term',
      rules: []
    },
    output: {
      markdownPath: 'docs/roadmap.md',
      jsonPath: 'apps/web/src/data/roadmap-items.json'
    }
  };
}

/**
 * Fetch GitHub issues and PRs with the roadmap label and title prefix
 * @param {Object} config - Configuration object
 * @param {string} token - GitHub token
 * @returns {Promise<Array>} - Array of roadmap items from GitHub
 */
export async function fetchGitHubIssues(config, token) {
  const { owner, repo, label, titlePrefix } = config.github;
  const items = [];
  let page = 1;
  const perPage = 100;
  
  if (!token) {
    console.warn('No GitHub token provided, skipping GitHub API fetch');
    return items;
  }
  
  try {
    while (true) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues?labels=${encodeURIComponent(label)}&state=all&per_page=${perPage}&page=${page}`;
      
      const response = await fetchWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'anyclick-roadmap-sync'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository ${owner}/${repo} not found or no access`);
          break;
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        break;
      }
      
      // Filter by title prefix and extract metadata
      for (const item of data) {
        if (titlePrefix && !item.title.startsWith(titlePrefix)) {
          continue;
        }
        
        const roadmapItem = {
          id: `github-${item.number}`,
          source: 'github',
          type: item.pull_request ? 'pr' : 'issue',
          title: titlePrefix ? item.title.replace(titlePrefix, '').trim() : item.title,
          description: item.body ? item.body.substring(0, 500) : '',
          era: extractEraFromLabels(item.labels, config.github.eraLabels),
          status: item.state,
          url: item.html_url,
          labels: item.labels.map(l => l.name),
          assignees: item.assignees?.map(a => a.login) || [],
          milestone: item.milestone?.title || null,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
        
        items.push(roadmapItem);
      }
      
      page++;
      
      // Check for pagination
      const linkHeader = response.headers.get('Link');
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break;
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub issues:', error.message);
  }
  
  return items;
}

/**
 * Fetch with retry and exponential backoff for rate limiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
      const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10);
      const waitTime = Math.max(resetTime * 1000 - Date.now(), 1000) + 1000;
      console.warn(`Rate limited, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000)));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Extract era from GitHub labels
 * @param {Array} labels - Array of label objects
 * @param {Object} eraLabels - Mapping of era to label names
 * @returns {string|null} - The era or null if not found
 */
function extractEraFromLabels(labels, eraLabels) {
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  for (const [era, aliases] of Object.entries(eraLabels)) {
    for (const alias of aliases) {
      if (labelNames.includes(alias.toLowerCase())) {
        return era;
      }
    }
  }
  
  return null;
}

/**
 * Parse plan files for roadmap metadata
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} - Array of roadmap items from plan files
 */
export async function parsePlanFiles(config) {
  const items = [];
  const planDir = config.plans?.directory || '.cursor/plans';
  
  try {
    const files = await fs.readdir(planDir);
    const planFiles = files.filter(f => f.endsWith('.plan.md'));
    
    for (const file of planFiles) {
      const filePath = path.join(planDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const metadata = extractPlanMetadata(content, file);
      
      if (metadata.roadmap) {
        const todos = config.plans?.includeTodos ? extractTodos(content) : [];
        
        const roadmapItem = {
          id: `plan-${file.replace('.plan.md', '')}`,
          source: 'plan',
          type: 'plan',
          title: metadata.title || file.replace('.plan.md', '').replace(/-/g, ' '),
          description: metadata.description || '',
          era: metadata.era || null,
          status: todos.some(t => !t.completed) ? 'active' : 'completed',
          url: filePath,
          todos: todos,
          labels: metadata.labels || [],
          createdAt: null,
          updatedAt: null
        };
        
        items.push(roadmapItem);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error parsing plan files:', error.message);
    }
  }
  
  return items;
}

/**
 * Extract metadata from a plan file
 * @param {string} content - Plan file content
 * @param {string} filename - The filename
 * @returns {Object} - Extracted metadata
 */
export function extractPlanMetadata(content, filename) {
  const metadata = {
    roadmap: false,
    title: null,
    description: null,
    era: null,
    labels: []
  };
  
  // Check for metadata section at the end (common pattern)
  const metadataMatch = content.match(/(?:^|\n)(?:Metadata|## Metadata|### Metadata)\s*\n([\s\S]*?)(?:\n##|$)/i);
  if (metadataMatch) {
    const metadataSection = metadataMatch[1];
    
    // Check for roadmap flag
    if (/^\s*-?\s*roadmap\b/mi.test(metadataSection)) {
      metadata.roadmap = true;
    }
    
    // Check for era
    const eraMatch = metadataSection.match(/^\s*-?\s*(short-term|mid-term|later)\b/mi);
    if (eraMatch) {
      metadata.era = eraMatch[1].toLowerCase();
    }
  }
  
  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+?)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Extract description from overview section
  const overviewMatch = content.match(/##\s+Overview\s*\n\n?([\s\S]*?)(?:\n##|$)/i);
  if (overviewMatch) {
    metadata.description = overviewMatch[1].trim().substring(0, 500);
  }
  
  return metadata;
}

/**
 * Extract todos from plan file content
 * @param {string} content - Plan file content
 * @returns {Array} - Array of todo items
 */
export function extractTodos(content) {
  const todos = [];
  const todoRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
  let match;
  
  while ((match = todoRegex.exec(content)) !== null) {
    todos.push({
      completed: match[1].toLowerCase() === 'x',
      text: match[2].trim()
    });
  }
  
  return todos;
}

/**
 * Assign era to items that don't have one
 * @param {Array} items - Array of roadmap items
 * @param {Object} config - Configuration object
 * @returns {Array} - Items with eras assigned
 */
export function assignEras(items, config) {
  const { defaultEra, rules } = config.eras || {};
  
  return items.map(item => {
    if (item.era) {
      return item;
    }
    
    let assignedEra = null;
    
    // Apply rules
    for (const rule of rules || []) {
      if (matchesRule(item, rule)) {
        assignedEra = rule.era;
        console.log(`Era assigned by rule "${rule.condition}": ${item.title} → ${assignedEra}`);
        break;
      }
    }
    
    // Apply heuristics if no rule matched
    if (!assignedEra) {
      // Check priority labels
      if (item.labels?.some(l => l.toLowerCase().includes('priority:high') || l.toLowerCase().includes('urgent'))) {
        assignedEra = 'short-term';
      } else if (item.labels?.some(l => l.toLowerCase().includes('priority:low'))) {
        assignedEra = 'later';
      }
      // Check age (older than 90 days)
      else if (item.createdAt) {
        const age = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (age > 90) {
          assignedEra = 'later';
        }
      }
    }
    
    // Use default if still not assigned
    if (!assignedEra) {
      assignedEra = defaultEra || 'mid-term';
    }
    
    return {
      ...item,
      era: assignedEra
    };
  });
}

/**
 * Check if an item matches a rule condition
 * @param {Object} item - Roadmap item
 * @param {Object} rule - Rule object
 * @returns {boolean} - Whether the item matches the rule
 */
function matchesRule(item, rule) {
  const { condition } = rule;
  
  // Label condition: label:labelname
  const labelMatch = condition.match(/^label:(.+)$/);
  if (labelMatch) {
    const labelPattern = labelMatch[1].toLowerCase();
    return item.labels?.some(l => l.toLowerCase().includes(labelPattern));
  }
  
  // Age condition: age:>Ndays
  const ageMatch = condition.match(/^age:([<>])(\d+)days$/);
  if (ageMatch && item.createdAt) {
    const operator = ageMatch[1];
    const days = parseInt(ageMatch[2], 10);
    const age = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (operator === '>' && age > days) return true;
    if (operator === '<' && age < days) return true;
  }
  
  return false;
}

/**
 * Deduplicate items by matching titles
 * @param {Array} items - Array of roadmap items
 * @returns {Array} - Deduplicated items
 */
export function deduplicateItems(items) {
  const seen = new Map();
  
  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (seen.has(normalizedTitle)) {
      const existing = seen.get(normalizedTitle);
      // Prefer GitHub items over plans
      if (item.source === 'github' && existing.source === 'plan') {
        // Merge plan todos into GitHub item
        if (existing.todos?.length) {
          item.todos = existing.todos;
        }
        seen.set(normalizedTitle, item);
      }
      // Otherwise keep the existing one
    } else {
      seen.set(normalizedTitle, item);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Generate a unique ID for an item
 * @param {Object} item - Roadmap item
 * @returns {string} - Unique ID
 */
export function generateItemId(item) {
  if (item.id) return item.id;
  
  const prefix = item.source === 'github' ? 'github' : 'plan';
  const slug = item.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  return `${prefix}-${slug}`;
}

/**
 * Generate roadmap JSON structure
 * @param {Array} items - Array of roadmap items
 * @param {Object} existingData - Existing JSON data to preserve roles section
 * @returns {Object} - JSON structure for roadmap-items.json
 */
export function generateRoadmapJson(items, existingData = {}) {
  const sortedItems = [...items].sort((a, b) => {
    // Sort by era first
    const eraOrder = { 'short-term': 0, 'mid-term': 1, 'later': 2 };
    const eraA = eraOrder[a.era] ?? 1;
    const eraB = eraOrder[b.era] ?? 1;
    if (eraA !== eraB) return eraA - eraB;
    
    // Then by updated date
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
  
  return {
    items: sortedItems.map(item => ({
      id: item.id,
      source: item.source,
      type: item.type,
      title: item.title,
      description: item.description || '',
      era: item.era,
      status: item.status,
      url: item.url,
      labels: item.labels || [],
      tags: item.tags || [],
      assignees: item.assignees || [],
      todos: item.todos || [],
      updatedAt: item.updatedAt || new Date().toISOString()
    })),
    // Preserve the roles section from existing data
    roles: existingData.roles || {},
    lastSynced: new Date().toISOString(),
    version: '1.1.0'
  };
}

/**
 * Generate roadmap markdown content
 * @param {Array} items - Array of roadmap items
 * @param {string} existingContent - Existing markdown content (to preserve manual sections)
 * @returns {string} - Generated markdown content
 */
export function generateRoadmapMarkdown(items, existingContent = '') {
  const groupedItems = {
    'short-term': items.filter(i => i.era === 'short-term'),
    'mid-term': items.filter(i => i.era === 'mid-term'),
    'later': items.filter(i => i.era === 'later')
  };
  
  // Check for manual content markers
  const autoStartMarker = '<!-- ROADMAP:AUTO-START -->';
  const autoEndMarker = '<!-- ROADMAP:AUTO-END -->';
  
  // Generate auto section
  let autoSection = '';
  
  autoSection += '## Short-term (next up)\n\n';
  if (groupedItems['short-term'].length === 0) {
    autoSection += '*No items currently scheduled for short-term.*\n\n';
  } else {
    for (const item of groupedItems['short-term']) {
      autoSection += formatMarkdownItem(item);
    }
    autoSection += '\n';
  }
  
  autoSection += '## Mid-term\n\n';
  if (groupedItems['mid-term'].length === 0) {
    autoSection += '*No items currently scheduled for mid-term.*\n\n';
  } else {
    for (const item of groupedItems['mid-term']) {
      autoSection += formatMarkdownItem(item);
    }
    autoSection += '\n';
  }
  
  autoSection += '## Later\n\n';
  if (groupedItems['later'].length === 0) {
    autoSection += '*No items currently scheduled for later.*\n\n';
  } else {
    for (const item of groupedItems['later']) {
      autoSection += formatMarkdownItem(item);
    }
  }
  
  // If existing content has markers, replace auto section
  if (existingContent.includes(autoStartMarker) && existingContent.includes(autoEndMarker)) {
    const beforeAuto = existingContent.substring(0, existingContent.indexOf(autoStartMarker));
    const afterAuto = existingContent.substring(existingContent.indexOf(autoEndMarker) + autoEndMarker.length);
    
    return beforeAuto + autoStartMarker + '\n' + autoSection + autoEndMarker + afterAuto;
  }
  
  // Otherwise generate full document
  let markdown = '# Anyclick Roadmap\n\n';
  markdown += 'This roadmap tracks planned features and improvements for anyclick.\n\n';
  markdown += autoStartMarker + '\n';
  markdown += autoSection;
  markdown += autoEndMarker + '\n';
  
  return markdown;
}

/**
 * Format a single roadmap item as markdown
 * @param {Object} item - Roadmap item
 * @returns {string} - Markdown formatted item
 */
function formatMarkdownItem(item) {
  let line = '- ';
  
  // Add status indicator
  if (item.status === 'closed' || item.status === 'completed') {
    line += '✅ ';
  }
  
  // Add title
  line += `**${item.title}**`;
  
  // Add description if available
  if (item.description) {
    const shortDesc = item.description.split('\n')[0].substring(0, 100);
    line += `: ${shortDesc}`;
    if (item.description.length > 100) {
      line += '...';
    }
  }
  
  // Add source link
  if (item.url) {
    const linkText = item.source === 'github' ? `#${item.id.replace('github-', '')}` : 'plan';
    line += ` [${linkText}](${item.url})`;
  }
  
  // Add source badge
  if (item.source === 'github') {
    line += ' `GitHub`';
  } else if (item.source === 'plan') {
    line += ' `Plan`';
  }
  
  line += '\n';
  
  return line;
}

/**
 * Load existing roadmap items from JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Array>} - Array of existing items
 */
export async function loadExistingItems(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.items || [];
  } catch (error) {
    return [];
  }
}

/**
 * Load existing roadmap JSON data (for preserving roles, etc.)
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} - Existing JSON data or empty object
 */
export async function loadExistingData(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Merge synced items with existing items, preserving manual entries
 * @param {Array} syncedItems - Items from sync (GitHub + plans)
 * @param {Array} existingItems - Existing items from JSON
 * @returns {Array} - Merged items
 */
export function mergeWithExistingItems(syncedItems, existingItems) {
  // Get manual items from existing (these should be preserved)
  const manualItems = existingItems.filter(item => item.source === 'manual');
  
  // Create a map of synced items by ID
  const syncedMap = new Map(syncedItems.map(item => [item.id, item]));
  
  // Merge: synced items + manual items that aren't duplicated
  const merged = [...syncedItems];
  
  for (const manualItem of manualItems) {
    // Check if there's a synced item with similar title
    const normalizedTitle = manualItem.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hasDuplicate = syncedItems.some(item => {
      const syncedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      return syncedTitle === normalizedTitle;
    });
    
    if (!hasDuplicate) {
      merged.push(manualItem);
    }
  }
  
  return merged;
}

/**
 * Write roadmap JSON to file
 * @param {Object} data - JSON data to write
 * @param {string} filePath - Path to write to
 */
export async function writeRoadmapJson(data, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Written: ${filePath}`);
}

/**
 * Write roadmap markdown to file
 * @param {string} content - Markdown content to write
 * @param {string} filePath - Path to write to
 */
export async function writeRoadmapMarkdown(content, filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`Written: ${filePath}`);
}

/**
 * Read existing markdown file
 * @param {string} filePath - Path to read from
 * @returns {Promise<string>} - File content or empty string
 */
export async function readExistingMarkdown(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

/**
 * Generate sync report
 * @param {Array} items - Synced items
 * @param {Object} stats - Sync statistics
 * @returns {string} - Report text
 */
export function generateSyncReport(items, stats = {}) {
  const grouped = {
    'short-term': items.filter(i => i.era === 'short-term'),
    'mid-term': items.filter(i => i.era === 'mid-term'),
    'later': items.filter(i => i.era === 'later')
  };
  
  let report = '\n=== Roadmap Sync Report ===\n\n';
  report += `Total items: ${items.length}\n`;
  report += `  - GitHub: ${items.filter(i => i.source === 'github').length}\n`;
  report += `  - Plans: ${items.filter(i => i.source === 'plan').length}\n\n`;
  
  report += 'Items by era:\n';
  report += `  - Short-term: ${grouped['short-term'].length}\n`;
  report += `  - Mid-term: ${grouped['mid-term'].length}\n`;
  report += `  - Later: ${grouped['later'].length}\n\n`;
  
  if (stats.newItems) {
    report += `New items: ${stats.newItems}\n`;
  }
  if (stats.updatedItems) {
    report += `Updated items: ${stats.updatedItems}\n`;
  }
  if (stats.errors?.length) {
    report += '\nErrors:\n';
    for (const error of stats.errors) {
      report += `  - ${error}\n`;
    }
  }
  
  report += '\n=== End Report ===\n';
  
  return report;
}

