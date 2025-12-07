import { type CapturePayload, type QueuedPayload, STORAGE_KEYS } from "./types";

/**
 * Load queue from chrome.storage.local
 */
export async function getQueue(): Promise<QueuedPayload[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.QUEUE], (result) => {
      const queue =
        (result[STORAGE_KEYS.QUEUE] as QueuedPayload[] | undefined) || [];
      resolve(queue);
    });
  });
}

/**
 * Persist queue to chrome.storage.local
 */
export async function saveQueue(queue: QueuedPayload[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.QUEUE]: queue }, () => resolve());
  });
}

/**
 * Add a payload to the queue
 */
export async function addToQueue(
  payload: CapturePayload,
  tabId?: number,
): Promise<QueuedPayload> {
  const queue = await getQueue();
  const item: QueuedPayload = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    payload,
    attempts: 0,
    createdAt: Date.now(),
    nextRetry: Date.now(),
    tabId,
  };

  queue.push(item);
  await saveQueue(queue);
  return item;
}

/**
 * Remove item by id
 */
export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const next = queue.filter((item) => item.id !== id);
  await saveQueue(next);
}

/**
 * Update existing item in queue
 */
export async function updateQueueItem(
  id: string,
  update: Partial<QueuedPayload>,
): Promise<void> {
  const queue = await getQueue();
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return;
  queue[index] = { ...queue[index], ...update };
  await saveQueue(queue);
}
