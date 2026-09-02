import type { AnyclickAdapter } from "@ewjdev/anyclick-core";
import { createHttpAdapter } from "@ewjdev/anyclick-github";

/**
 * Shared, module-level adapters for the example and docs pages.
 * Module-level so provider effects don't re-run on every render.
 */

/** Posts to the site's feedback route (GitHub / Jira / Cursor on the server). */
export const feedbackAdapter: AnyclickAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

/** Never leaves the browser. For demos that must not transmit anything. */
export const captureOnlyAdapter: AnyclickAdapter = {
  submitAnyclick: async () => {},
};
