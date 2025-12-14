export type DebugInfo = {
  status: number;
  ok: boolean;
  contentType: string | null;
  rawTextPreview: string;
  parsedKeys?: string[];
  contentPreview?: string;
  payloadPreview?: string;
  timestamp: number;
  error?: string;
};

export function createDebugInfo(args: {
  status: number;
  ok: boolean;
  contentType?: string | null;
  rawText?: string;
  error?: string;
}): DebugInfo {
  return {
    status: args.status,
    ok: args.ok,
    contentType: args.contentType ?? null,
    rawTextPreview: args.rawText ?? "",
    timestamp: Date.now(),
    error: args.error,
  };
}
