/**
 * One-time warning helper to avoid console noise.
 */
export function createWarnOnce(message: string) {
  let warned = false;
  return () => {
    if (warned) return;
    warned = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(message);
    }
  };
}
