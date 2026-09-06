import { beforeEach, expect, it, vi } from "vitest";
import type { Preview, Receipt } from "../../apps/web/src/lib/showcase/actions";
import {
  executeGitHub,
  reconcileIssue,
} from "../../apps/web/src/lib/showcase/github";

const mocks = vi.hoisted(() => ({
  saved: new Map<string, Receipt>(),
  budget: vi.fn(async () => {}),
  acquire: vi.fn(async () => async () => {}),
}));
vi.mock("../../apps/web/src/lib/showcase/storage", () => ({
  acquire: mocks.acquire,
  reserveBudget: mocks.budget,
  key: (_session: unknown, suffix: string) => suffix,
  storage: () => ({
    set: async (key: string, value: Receipt) => {
      mocks.saved.set(key, value);
    },
    get: async (key: string) => mocks.saved.get(key),
  }),
}));

const request = new Request("https://anyclick.dev/api/showcase/execution");
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
  mocks.saved.clear();
  vi.clearAllMocks();
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
  expect((await reconcileIssue(session, unknown, request)).status).toBe(
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
  const result = await reconcileIssue(
    session,
    {
      ...receipt,
      status: "outcome_unknown",
    },
    request,
  );
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

it("does not charge quota or call GitHub while reconciliation is cooling down", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const stale: Receipt = { ...receipt, status: "outcome_unknown" };
  mocks.saved.set("execution:execution", {
    ...stale,
    reconciledAt: Date.now(),
  });
  const result = await reconcileIssue(session, stale, request);
  expect(result.reconciledAt).toBeDefined();
  expect(mocks.budget).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
it("charges quota once for a real lookup and skips a subsequent stale poll", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json([]));
  vi.stubGlobal("fetch", fetcher);
  const stale: Receipt = { ...receipt, status: "outcome_unknown" };
  await reconcileIssue(session, stale, request);
  await reconcileIssue(session, stale, request);
  expect(mocks.budget).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("bounds waiting for the shared repository writer and saves a retryable receipt on timeout", async () => {
  const { DomainError } = await import(
    "../../apps/web/src/lib/showcase/domain"
  );
  mocks.acquire.mockRejectedValueOnce(
    new DomainError("Another request is running.", 409),
  );
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const result = await executeGitHub(session, preview, receipt);
  expect(mocks.acquire).toHaveBeenCalledWith(
    "showcase:github:example/demo:writer",
    80,
    8000,
  );
  expect(result.status).toBe("failed");
  expect(mocks.saved.get("execution:execution")).toEqual(result);
  expect(fetcher).not.toHaveBeenCalled();
});
