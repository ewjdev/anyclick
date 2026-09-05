import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as execute } from "../../apps/web/src/app/api/showcase/execute/route";
import { previewAction } from "../../apps/web/src/lib/showcase/actions";
import {
  commit,
  createSession,
  key,
  readBody,
  requireSession,
  stateFor,
} from "../../apps/web/src/lib/showcase/storage";

const { records } = vi.hoisted(() => ({ records: new Map<string, unknown>() }));
vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(key: string) {
      return structuredClone(records.get(key) ?? null);
    }
    async set(key: string, value: unknown, options?: { nx?: boolean }) {
      if (options?.nx && records.has(key)) return null;
      records.set(key, structuredClone(value));
      return "OK";
    }
    async del(key: string) {
      return records.delete(key);
    }
    async eval(script: string, keys: string[], args: unknown[]) {
      if (script.includes("current.revision")) {
        const current = records.get(keys[0]) as
          | { revision: number }
          | undefined;
        if ((current?.revision ?? 0) !== args[0]) return 0;
        records.set(keys[0], JSON.parse(args[1] as string));
        if (keys[1]) records.set(keys[1], JSON.parse(args[3] as string));
        return 1;
      }
      if (script.includes("ARGV[1] then")) {
        if (records.get(keys[0]) === args[0]) records.delete(keys[0]);
        return 1;
      }
      return 1;
    }
  },
}));

function request(session: { id: string }, body: unknown) {
  return new Request("https://anyclick.dev/api/showcase/execute", {
    method: "POST",
    headers: {
      cookie: `anyclick_showcase=${session.id}`,
      "content-type": "application/json",
      origin: "https://anyclick.dev",
      "x-forwarded-for": "192.0.2.1",
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  records.clear();
  vi.stubEnv("SHOWCASE_ENABLED", "true");
  vi.stubEnv("QUICKCHAT_KV_REST_API_URL", "https://redis.test");
  vi.stubEnv("QUICKCHAT_KV_REST_API_TOKEN", "test-only");
});
describe("server boundaries", () => {
  it("isolates visitors who share an IP address", async () => {
    const first = await createSession();
    const second = await createSession();
    expect((await requireSession(request(first, {}))).id).not.toBe(
      (await requireSession(request(second, {}))).id,
    );
    const state = await stateFor(first, "software");
    state.objects[0].label = "Only first visitor";
    records.set(key(first, "scenario:software"), state);
    expect((await stateFor(second, "software")).objects[0].label).toBe(
      "Complete order",
    );
  });
  it("rejects cross-origin mutations before reading their contents", async () => {
    await expect(
      readBody(
        new Request("https://anyclick.dev/api/showcase/execute", {
          method: "POST",
          headers: {
            origin: "https://elsewhere.test",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      ),
    ).rejects.toThrow("workspace");
  });
  it("rejects oversized bodies", async () => {
    await expect(
      readBody(
        new Request("https://anyclick.dev/api/showcase/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: '"' + "x".repeat(2 * 1024 * 1024) + '"',
        }),
      ),
    ).rejects.toThrow("too large");
  });
  it("returns the same receipt for duplicate submissions without writing twice", async () => {
    const session = await createSession();
    const preview = await previewAction(session, {
      scenario: "social",
      actionId: "rewrite",
      objectId: "post-18",
      values: { text: "Reviewed copy" },
    });
    const body = { previewId: preview.id, idempotencyKey: crypto.randomUUID() };
    const first = await execute(request(session, body));
    const second = await execute(request(session, body));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(await second.json());
    expect((await stateFor(session, "social")).revision).toBe(1);
  });
  it("binds previews to a visitor", async () => {
    const first = await createSession();
    const other = await createSession();
    const preview = await previewAction(first, {
      scenario: "social",
      actionId: "rewrite",
      objectId: "post-18",
      values: { text: "Private draft" },
    });
    expect(
      (
        await execute(
          request(other, {
            previewId: preview.id,
            idempotencyKey: crypto.randomUUID(),
          }),
        )
      ).status,
    ).toBe(409);
  });
  it("rejects stale previews and does not overwrite intervening edits", async () => {
    const session = await createSession();
    const preview = await previewAction(session, {
      scenario: "social",
      actionId: "rewrite",
      objectId: "post-18",
      values: { text: "Old draft" },
    });
    const state = await stateFor(session, "social");
    state.revision = 1;
    state.objects[0].fields.text = "Other tab";
    await commit(session, "scenario:social", 0, state);
    expect(
      (
        await execute(
          request(session, {
            previewId: preview.id,
            idempotencyKey: crypto.randomUUID(),
          }),
        )
      ).status,
    ).toBe(409);
    expect((await stateFor(session, "social")).objects[0].fields.text).toBe(
      "Other tab",
    );
  });
  it("rejects a reused execution identifier with different inputs", async () => {
    const session = await createSession();
    const id = crypto.randomUUID();
    for (const [text, expectedStatus] of [
      ["First", 200],
      ["Second", 409],
    ] as const) {
      const preview = await previewAction(session, {
        scenario: "social",
        actionId: "rewrite",
        objectId: "post-18",
        values: { text },
      });
      expect(
        (
          await execute(
            request(session, { previewId: preview.id, idempotencyKey: id }),
          )
        ).status,
      ).toBe(expectedStatus);
    }
  });
});
