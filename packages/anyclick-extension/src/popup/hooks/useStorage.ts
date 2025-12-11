import { useCallback, useEffect, useState } from "react";

/**
 * React hook for Chrome extension storage.
 * Listens for storage changes and updates state automatically.
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial value
    chrome.storage.local.get([key], (result) => {
      setValue(result[key] ?? defaultValue);
      setLoading(false);
    });

    // Listen for changes
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local" && changes[key]) {
        setValue(changes[key].newValue ?? defaultValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key, defaultValue]);

  const setStorageValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await chrome.storage.local.set({ [key]: newValue });
    },
    [key],
  );

  return [value, setStorageValue, loading];
}

/**
 * Load multiple storage keys at once
 */
export function useStorageMulti<T extends Record<string, unknown>>(
  keys: string[],
  defaults: T,
): [T, (updates: Partial<T>) => Promise<void>, boolean] {
  const [values, setValues] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(keys, (result) => {
      const merged = { ...defaults };
      for (const key of keys) {
        if (result[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = result[key];
        }
      }
      setValues(merged as T);
      setLoading(false);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      const hasRelevant = keys.some((k) => k in changes);
      if (hasRelevant) {
        setValues((prev) => {
          const updated = { ...prev };
          for (const key of keys) {
            if (changes[key]) {
              (updated as Record<string, unknown>)[key] =
                changes[key].newValue ??
                (defaults as Record<string, unknown>)[key];
            }
          }
          return updated;
        });
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [keys.join(",")]);

  const setStorageValues = useCallback(async (updates: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...updates }));
    await chrome.storage.local.set(updates);
  }, []);

  return [values, setStorageValues, loading];
}
