import type { PointerConfig } from "@ewjdev/anyclick-pointer";

export interface AdapterMeta {
  name: string;
  version: string;
  description?: string;
  experimental?: boolean;
  tags?: string[];
}

export interface AdapterContext {
  /**
   * Apply a partial PointerConfig to the active pointer provider.
   * Consumers can merge or overwrite as needed.
   */
  setConfig: (config: Partial<PointerConfig>) => void;
}

export interface PointerAdapter {
  meta: AdapterMeta;
  activate: (context: AdapterContext) => void;
  deactivate?: (context: AdapterContext) => void;
}
