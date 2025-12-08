# Plan: Anyclick Extension Performance Optimization (<100ms)

## Goal

Reduce perceived capture latency from ~600ms to <100ms by showing instant feedback and processing screenshot/submission asynchronously.

## Current Bottlenecks

- Screenshot capture: ~200-400ms (blocking)
- HTTP submission: ~100-300ms (blocking)
- DOM traversal: ~20-50ms (acceptable)
- Message passing: ~10-20ms (acceptable)

## Architecture Changes

### 1. Split Capture Flow

**Current**: `capture DOM → screenshot → submit → toast` (600ms blocking)
**New**: `capture DOM → toast (50ms)` → `[async: queue → screenshot → submit]`

### 2. Async Queue System

- Use `chrome.storage.local` for reliable queue persistence
- Background worker processes queue independently
- Retry failed submissions without blocking UI
- Queue persists across extension restarts

### 3. Optimize DOM Capture

- Reduce `MAX_INNER_TEXT` from 300 to 200 chars
- Reduce `MAX_OUTER_HTML` from 800 to 500 chars
- Reduce `MAX_ANCESTORS` from 4 to 3
- Skip `outerHTML` for elements >10KB
- Cache selector results for repeated elements

### 4. Defer Screenshot

- Capture screenshot after showing success toast (non-blocking)
- Move screenshot to background queue processor
- If screenshot fails, submit payload without screenshot

## Implementation Steps

### Step 1: Add Queue Infrastructure

- Create `src/queue.ts` with queue management (add, process, retry)
- Use `chrome.storage.local` with key `anyclick_queue`
- Queue items: `{ id, payload, attempts, createdAt, nextRetry }`
- Background worker processes queue on startup and periodically

### Step 2: Refactor Content Script

- Split `handleCapture()` into:
- `captureDOM()` - sync, returns payload immediately (~30-50ms)
- `queuePayload()` - async, adds to queue and shows success toast
- Remove screenshot from critical path
- Show "Captured!" toast immediately after DOM capture
- Track capture time for metrics

### Step 3: Optimize DOM Capture

- Update `PERF_LIMITS` in `types.ts`:
- `MAX_INNER_TEXT: 200` (was 300)
- `MAX_OUTER_HTML: 500` (was 800)
- `MAX_ANCESTORS: 3` (was 4)
- Add early exit for large elements (skip outerHTML if >10KB)
- Add simple selector cache (Map<Element, string>)

### Step 4: Background Queue Processor

- Add `processQueue()` function in `background.ts`
- Process queue items sequentially with delays
- Capture screenshot in background (non-blocking)
- Submit payload with retries
- Remove successful items, retry failed items with exponential backoff
- Process queue on: startup, after new item added, periodically (every 5s)

### Step 5: Defer Screenshot Capture

- Move screenshot request to queue processor
- Capture screenshot in background worker (not content script)
- Attach screenshot to payload before submission
- If screenshot fails, submit payload without screenshot

### Step 6: Add Performance Metrics

- Track `captureTimeMs` (DOM capture only)
- Track `queueTimeMs` (time to add to queue)
- Track `processTimeMs` (background processing)
- Log metrics to console in dev mode

## Files to Modify

1. **`src/types.ts`**

- Update `PERF_LIMITS` constants
- Add `QueuedPayload` interface
- Add queue-related storage keys

2. **`src/content.ts`**

- Refactor `handleCapture()` to sync DOM capture + async queue
- Remove screenshot from critical path
- Show success toast immediately
- Add `queuePayload()` function

3. **`src/background.ts`**

- Add `processQueue()` function
- Add queue processing on startup
- Move screenshot capture to queue processor
- Add periodic queue processing (alarms API)

4. **`src/queue.ts`** (new)

- `addToQueue(payload)` - add payload to queue
- `processQueue()` - process all queued items
- `retryItem(item)` - retry failed submission
- `removeItem(id)` - remove successful item

## Performance Targets

- **Perceived latency**: <100ms (toast shown)
- **DOM capture**: <50ms (optimized traversal)
- **Queue add**: <10ms (storage write)
- **Screenshot**: ~200-400ms (async, non-blocking)
- **Submission**: ~100-300ms (async, non-blocking)

## Testing

- Measure capture time before/after optimization
- Verify queue persists across restarts
- Test retry logic with failed endpoints
- Verify screenshot attaches correctly in async flow
- Test with large/complex DOM structures