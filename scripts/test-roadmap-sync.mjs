#!/usr/bin/env node

/**
 * Test Suite for Roadmap Sync
 * 
 * Run with: node scripts/test-roadmap-sync.mjs
 */

import {
  loadConfig,
  getDefaultConfig,
  extractPlanMetadata,
  extractTodos,
  assignEras,
  deduplicateItems,
  generateRoadmapJson,
  generateRoadmapMarkdown,
  mergeWithExistingItems,
  generateItemId
} from './roadmap-utils.mjs';

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n     Expected: ${JSON.stringify(expected)}\n     Actual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(value, message = 'Expected true') {
  if (!value) {
    throw new Error(message);
  }
}

function assertFalse(value, message = 'Expected false') {
  if (value) {
    throw new Error(message);
  }
}

function assertIncludes(array, item, message = '') {
  if (!array.includes(item)) {
    throw new Error(`${message}\n     Array does not include: ${item}`);
  }
}

// ============================================
// Test Suites
// ============================================

console.log('\n🧪 Running Roadmap Sync Tests\n');

// --------------------------------------------
// Config Tests
// --------------------------------------------
console.log('📁 Config Tests');

test('getDefaultConfig returns valid config', () => {
  const config = getDefaultConfig();
  assertTrue(config.github !== undefined, 'Missing github config');
  assertTrue(config.plans !== undefined, 'Missing plans config');
  assertTrue(config.eras !== undefined, 'Missing eras config');
  assertTrue(config.output !== undefined, 'Missing output config');
  assertEqual(config.github.owner, 'ewjdev');
  assertEqual(config.github.repo, 'anyclick');
});

test('getDefaultConfig has required era labels', () => {
  const config = getDefaultConfig();
  assertTrue(config.github.eraLabels['short-term'] !== undefined);
  assertTrue(config.github.eraLabels['mid-term'] !== undefined);
  assertTrue(config.github.eraLabels['later'] !== undefined);
});

// --------------------------------------------
// Plan Metadata Extraction Tests
// --------------------------------------------
console.log('\n📄 Plan Metadata Extraction Tests');

test('extractPlanMetadata detects roadmap flag', () => {
  const content = `# Test Plan

## Overview

Some description.

Metadata

- roadmap
- short-term`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertTrue(metadata.roadmap, 'Should detect roadmap flag');
  assertEqual(metadata.era, 'short-term');
});

test('extractPlanMetadata extracts title from H1', () => {
  const content = `# My Feature Plan

## Overview

Description here.`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertEqual(metadata.title, 'My Feature Plan');
});

test('extractPlanMetadata extracts description from Overview', () => {
  const content = `# Plan

## Overview

This is the overview description.

## Other Section`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertEqual(metadata.description, 'This is the overview description.');
});

test('extractPlanMetadata handles mid-term era', () => {
  const content = `# Plan

Metadata

- roadmap
- mid-term`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertEqual(metadata.era, 'mid-term');
});

test('extractPlanMetadata handles later era', () => {
  const content = `# Plan

Metadata

- roadmap
- later`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertEqual(metadata.era, 'later');
});

test('extractPlanMetadata returns false for non-roadmap plans', () => {
  const content = `# Just a Plan

## Overview

Not a roadmap item.`;

  const metadata = extractPlanMetadata(content, 'test.plan.md');
  assertFalse(metadata.roadmap, 'Should not detect roadmap flag');
});

// --------------------------------------------
// Todo Extraction Tests
// --------------------------------------------
console.log('\n✅ Todo Extraction Tests');

test('extractTodos extracts unchecked todos', () => {
  const content = `
- [ ] First task
- [ ] Second task
`;
  const todos = extractTodos(content);
  assertEqual(todos.length, 2);
  assertFalse(todos[0].completed);
  assertEqual(todos[0].text, 'First task');
});

test('extractTodos extracts checked todos', () => {
  const content = `
- [x] Completed task
- [X] Also completed
`;
  const todos = extractTodos(content);
  assertEqual(todos.length, 2);
  assertTrue(todos[0].completed);
  assertTrue(todos[1].completed);
});

test('extractTodos handles mixed todos', () => {
  const content = `
- [x] Done
- [ ] Not done
- [X] Also done
`;
  const todos = extractTodos(content);
  assertEqual(todos.length, 3);
  assertTrue(todos[0].completed);
  assertFalse(todos[1].completed);
  assertTrue(todos[2].completed);
});

test('extractTodos handles asterisk bullets', () => {
  const content = `
* [ ] Task with asterisk
* [x] Completed with asterisk
`;
  const todos = extractTodos(content);
  assertEqual(todos.length, 2);
});

// --------------------------------------------
// Era Assignment Tests
// --------------------------------------------
console.log('\n🏷️ Era Assignment Tests');

test('assignEras keeps existing era', () => {
  const items = [{ id: '1', title: 'Test', era: 'short-term', labels: [] }];
  const config = getDefaultConfig();
  const result = assignEras(items, config);
  assertEqual(result[0].era, 'short-term');
});

test('assignEras assigns default era when missing', () => {
  const items = [{ id: '1', title: 'Test', era: null, labels: [] }];
  const config = getDefaultConfig();
  const result = assignEras(items, config);
  assertEqual(result[0].era, 'mid-term'); // Default
});

test('assignEras applies priority:high rule', () => {
  const items = [{ id: '1', title: 'Test', era: null, labels: ['priority:high'] }];
  const config = getDefaultConfig();
  const result = assignEras(items, config);
  assertEqual(result[0].era, 'short-term');
});

test('assignEras applies priority:low rule', () => {
  const items = [{ id: '1', title: 'Test', era: null, labels: ['priority:low'] }];
  const config = getDefaultConfig();
  const result = assignEras(items, config);
  assertEqual(result[0].era, 'later');
});

test('assignEras applies age rule for old items', () => {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
  
  const items = [{ 
    id: '1', 
    title: 'Test', 
    era: null, 
    labels: [],
    createdAt: oldDate.toISOString()
  }];
  const config = getDefaultConfig();
  const result = assignEras(items, config);
  assertEqual(result[0].era, 'later');
});

// --------------------------------------------
// Deduplication Tests
// --------------------------------------------
console.log('\n🔄 Deduplication Tests');

test('deduplicateItems removes exact duplicates', () => {
  const items = [
    { id: '1', title: 'Feature One', source: 'github' },
    { id: '2', title: 'Feature One', source: 'plan' }
  ];
  const result = deduplicateItems(items);
  assertEqual(result.length, 1);
});

test('deduplicateItems prefers GitHub over plan', () => {
  const items = [
    { id: 'plan-1', title: 'Feature', source: 'plan', todos: ['task1'] },
    { id: 'github-1', title: 'Feature', source: 'github' }
  ];
  const result = deduplicateItems(items);
  assertEqual(result.length, 1);
  assertEqual(result[0].source, 'github');
});

test('deduplicateItems merges todos from plan to GitHub', () => {
  const items = [
    { id: 'plan-1', title: 'Feature', source: 'plan', todos: ['task1', 'task2'] },
    { id: 'github-1', title: 'Feature', source: 'github', todos: [] }
  ];
  const result = deduplicateItems(items);
  assertEqual(result[0].todos.length, 2);
});

test('deduplicateItems handles case-insensitive matching', () => {
  const items = [
    { id: '1', title: 'My Feature', source: 'github' },
    { id: '2', title: 'my feature', source: 'plan' }
  ];
  const result = deduplicateItems(items);
  assertEqual(result.length, 1);
});

test('deduplicateItems keeps unique items', () => {
  const items = [
    { id: '1', title: 'Feature One', source: 'github' },
    { id: '2', title: 'Feature Two', source: 'plan' }
  ];
  const result = deduplicateItems(items);
  assertEqual(result.length, 2);
});

// --------------------------------------------
// Merge With Existing Tests
// --------------------------------------------
console.log('\n🔀 Merge With Existing Tests');

test('mergeWithExistingItems preserves manual items', () => {
  const synced = [{ id: 'github-1', title: 'GitHub Item', source: 'github' }];
  const existing = [{ id: 'manual-1', title: 'Manual Item', source: 'manual' }];
  
  const result = mergeWithExistingItems(synced, existing);
  assertEqual(result.length, 2);
  assertTrue(result.some(i => i.source === 'manual'));
});

test('mergeWithExistingItems does not duplicate similar titles', () => {
  const synced = [{ id: 'github-1', title: 'My Feature', source: 'github' }];
  const existing = [{ id: 'manual-1', title: 'My Feature', source: 'manual' }];
  
  const result = mergeWithExistingItems(synced, existing);
  assertEqual(result.length, 1);
  assertEqual(result[0].source, 'github'); // Synced takes precedence
});

test('mergeWithExistingItems handles empty synced', () => {
  const synced = [];
  const existing = [{ id: 'manual-1', title: 'Manual', source: 'manual' }];
  
  const result = mergeWithExistingItems(synced, existing);
  assertEqual(result.length, 1);
});

test('mergeWithExistingItems handles empty existing', () => {
  const synced = [{ id: 'github-1', title: 'New', source: 'github' }];
  const existing = [];
  
  const result = mergeWithExistingItems(synced, existing);
  assertEqual(result.length, 1);
});

// --------------------------------------------
// JSON Generation Tests
// --------------------------------------------
console.log('\n📊 JSON Generation Tests');

test('generateRoadmapJson creates valid structure', () => {
  const items = [
    { id: '1', title: 'Test', source: 'manual', type: 'feature', era: 'short-term', status: 'open' }
  ];
  const result = generateRoadmapJson(items);
  
  assertTrue(result.items !== undefined);
  assertTrue(result.lastSynced !== undefined);
  assertTrue(result.version !== undefined);
  assertEqual(result.version, '1.1.0');
});

test('generateRoadmapJson sorts by era', () => {
  const items = [
    { id: '3', title: 'Later', era: 'later', source: 'manual' },
    { id: '1', title: 'Short', era: 'short-term', source: 'manual' },
    { id: '2', title: 'Mid', era: 'mid-term', source: 'manual' }
  ];
  const result = generateRoadmapJson(items);
  
  assertEqual(result.items[0].era, 'short-term');
  assertEqual(result.items[1].era, 'mid-term');
  assertEqual(result.items[2].era, 'later');
});

test('generateRoadmapJson includes all required fields', () => {
  const items = [{ 
    id: '1', 
    title: 'Test', 
    source: 'github',
    type: 'issue',
    description: 'Desc',
    era: 'short-term',
    status: 'open',
    url: 'http://example.com',
    labels: ['bug'],
    tags: ['homepage:qa'],
    assignees: ['user1'],
    todos: []
  }];
  const result = generateRoadmapJson(items);
  const item = result.items[0];
  
  assertTrue(item.id !== undefined);
  assertTrue(item.source !== undefined);
  assertTrue(item.type !== undefined);
  assertTrue(item.title !== undefined);
  assertTrue(item.description !== undefined);
  assertTrue(item.era !== undefined);
  assertTrue(item.status !== undefined);
  assertTrue(item.url !== undefined);
  assertTrue(item.labels !== undefined);
  assertTrue(item.tags !== undefined);
  assertTrue(item.assignees !== undefined);
  assertTrue(item.todos !== undefined);
  assertTrue(item.updatedAt !== undefined);
});

test('generateRoadmapJson preserves roles from existing data', () => {
  const items = [{ id: '1', title: 'Test', era: 'short-term', source: 'manual' }];
  const existingData = {
    roles: {
      qa: { title: 'QA', features: [] }
    }
  };
  const result = generateRoadmapJson(items, existingData);
  
  assertTrue(result.roles !== undefined);
  assertTrue(result.roles.qa !== undefined);
  assertEqual(result.roles.qa.title, 'QA');
});

// --------------------------------------------
// Markdown Generation Tests
// --------------------------------------------
console.log('\n📝 Markdown Generation Tests');

test('generateRoadmapMarkdown includes auto markers', () => {
  const items = [];
  const result = generateRoadmapMarkdown(items);
  
  assertTrue(result.includes('<!-- ROADMAP:AUTO-START -->'));
  assertTrue(result.includes('<!-- ROADMAP:AUTO-END -->'));
});

test('generateRoadmapMarkdown groups by era', () => {
  const items = [
    { id: '1', title: 'Short Item', era: 'short-term', status: 'open' },
    { id: '2', title: 'Mid Item', era: 'mid-term', status: 'open' },
    { id: '3', title: 'Later Item', era: 'later', status: 'open' }
  ];
  const result = generateRoadmapMarkdown(items);
  
  assertTrue(result.includes('## Short-term'));
  assertTrue(result.includes('## Mid-term'));
  assertTrue(result.includes('## Later'));
  assertTrue(result.includes('Short Item'));
  assertTrue(result.includes('Mid Item'));
  assertTrue(result.includes('Later Item'));
});

test('generateRoadmapMarkdown shows checkmark for completed', () => {
  const items = [
    { id: '1', title: 'Done', era: 'short-term', status: 'completed' }
  ];
  const result = generateRoadmapMarkdown(items);
  assertTrue(result.includes('✅'));
});

test('generateRoadmapMarkdown preserves existing content outside markers', () => {
  const items = [{ id: '1', title: 'New', era: 'short-term', status: 'open' }];
  const existing = `# Custom Header

Keep this content.

<!-- ROADMAP:AUTO-START -->
Old content to replace
<!-- ROADMAP:AUTO-END -->

And this footer too.`;

  const result = generateRoadmapMarkdown(items, existing);
  
  assertTrue(result.includes('# Custom Header'));
  assertTrue(result.includes('Keep this content'));
  assertTrue(result.includes('And this footer too'));
  assertTrue(result.includes('New'));
  assertFalse(result.includes('Old content to replace'));
});

test('generateRoadmapMarkdown handles empty eras', () => {
  const items = [
    { id: '1', title: 'Only Mid', era: 'mid-term', status: 'open' }
  ];
  const result = generateRoadmapMarkdown(items);
  
  assertTrue(result.includes('*No items currently scheduled for short-term.*'));
  assertTrue(result.includes('*No items currently scheduled for later.*'));
});

// --------------------------------------------
// Item ID Generation Tests
// --------------------------------------------
console.log('\n🔑 Item ID Generation Tests');

test('generateItemId returns existing id', () => {
  const item = { id: 'existing-id', title: 'Test', source: 'github' };
  assertEqual(generateItemId(item), 'existing-id');
});

test('generateItemId creates github prefix for github source', () => {
  const item = { title: 'My Feature', source: 'github' };
  const id = generateItemId(item);
  assertTrue(id.startsWith('github-'));
});

test('generateItemId creates plan prefix for plan source', () => {
  const item = { title: 'My Feature', source: 'plan' };
  const id = generateItemId(item);
  assertTrue(id.startsWith('plan-'));
});

test('generateItemId slugifies title', () => {
  const item = { title: 'My Cool Feature!', source: 'github' };
  const id = generateItemId(item);
  assertTrue(id.includes('my-cool-feature'));
  assertFalse(id.includes('!'));
});

// ============================================
// Summary
// ============================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('❌ Some tests failed!\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}

