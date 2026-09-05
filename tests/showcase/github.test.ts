import { beforeEach, expect, it, vi } from "vitest";
import type { Preview, Receipt } from "../../apps/web/src/lib/showcase/actions";
import {
  executeGitHub,
  reconcileIssue,
} from "../../apps/web/src/lib/showcase/github";

vi.mock("../../apps/web/src/lib/showcase/storage", () => ({
  acquire: vi.fn(async () => async () => {}),
  key: (_session: unknown, suffix: string) => suffix,
  storage: () => ({ set: vi.fn(async () => {}) }),
}));

const session = { id: "session", expiresAt: Date.now() + 86400000 };
const receipt: Receipt = {
  id: "execution",
  hash: "hash",
  scenario: "software",
  objectId: "checkout",
  actionId: "issue",
  status: "running",
  message: "Saving",
  createdAt: Date.now(),
  stage: "prepared",
};
const preview: Preview = {
  id: "preview",
  input: {
    scenario: "software",
    actionId: "issue",
    objectId: "checkout",
    values: { title: "Sample issue", text: "Reviewed body" },
  },
  hash: "hash",
  revision: 0,
  title: "Report",
  destination: "GitHub",
  before: {},
  expiresAt: Date.now() + 1000,
};
beforeEach(() => {
  vi.stubEnv("SHOWCASE_GITHUB_REPO", "example/demo");
  vi.stubEnv("SHOWCASE_GITHUB_TOKEN", "test-only");
});
it("never retries a create request after an ambiguous provider response", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockResolvedValueOnce(Response.json([]));
  vi.stubGlobal("fetch", fetcher);
  const unknown = await executeGitHub(session, preview, receipt);
  expect(unknown.status).toBe("outcome_unknown");
  expect((await reconcileIssue(session, unknown)).status).toBe(
    "outcome_unknown",
  );
  expect(
    fetcher.mock.calls.filter(([, init]) => init.method === "POST"),
  ).toHaveLength(1);
});
it("reconciles an existing issue using its execution marker", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json([
        {
          body: "<!-- anyclick-execution:execution -->",
          html_url: "https://github.com/example/demo/issues/1",
        },
      ]),
    ),
  );
  const result = await reconcileIssue(session, {
    ...receipt,
    status: "outcome_unknown",
  });
  expect(result.status).toBe("succeeded");
  expect(result.url).toContain("/issues/1");
});
it("does not attempt issue creation when asset upload fails", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("Missing", { status: 404 }))
    .mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));
  vi.stubGlobal("fetch", fetcher);
  const result = await executeGitHub(
    session,
    {
      ...preview,
      input: { ...preview.input, screenshot: "data:image/png;base64,test" },
    },
    receipt,
  );
  expect(result.status).toBe("failed");
  expect(fetcher.mock.calls.some(([, init]) => init.method === "POST")).toBe(
    false,
  );
});
