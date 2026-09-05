import { describe, expect, it } from "vitest";
import { scenarioIds, scenarios } from "../../apps/web/src/lib/showcase/domain";

const base = process.env.SHOWCASE_LIVE_BASE_URL;
describe.skipIf(!base)("live hosted integrations (explicit opt-in)", () => {
  async function session() {
    const response = await fetch(`${base}/api/showcase/workspace`);
    expect(response.status).toBe(200);
    return response.headers.get("set-cookie")!.split(";")[0];
  }
  async function call(path: string, cookie: string, body?: unknown) {
    const response = await fetch(`${base}/api/showcase/${path}`, {
      headers: {
        cookie,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(`${path}: ${response.status} ${data.error}`);
    return data;
  }
  it("persists every local journey, isolates sessions, and reverses a reviewed change", async () => {
    const cookie = await session();
    const other = await session();
    for (const scenario of scenarioIds)
      for (const task of scenarios[scenario].tasks.filter(
        (task) => task.id !== "issue",
      )) {
        const preview = await call("preview", cookie, {
          scenario,
          actionId: task.id,
          objectId: task.objectId,
          values: Object.fromEntries(
            task.fields.map((field) => [field.name, field.value]),
          ),
        });
        const submission = {
          previewId: preview.id,
          idempotencyKey: crypto.randomUUID(),
        };
        const receipt = await call("execute", cookie, submission);
        expect(receipt.status).toBe("succeeded");
        const duplicate = await call("execute", cookie, submission);
        expect(duplicate.id).toBe(receipt.id);
        const workspace = await call("workspace", cookie);
        expect(
          workspace.states.find(
            (state: { id: string }) => state.id === scenario,
          ).revision,
        ).toBe(receipt.revision);
        if (receipt.undoable) {
          const undo = await call("preview", cookie, {
            scenario,
            actionId: "undo",
            objectId: task.objectId,
            values: { executionId: receipt.id },
          });
          expect(
            (
              await call("execute", cookie, {
                previewId: undo.id,
                idempotencyKey: crypto.randomUUID(),
              })
            ).status,
          ).toBe("succeeded");
        }
      }
    expect(
      (await call("workspace", other)).states.every(
        (state: { revision: number }) => state.revision === 0,
      ),
    ).toBe(true);
  }, 60000);
  it("streams a real structured result and restores it from server history", async () => {
    const cookie = await session();
    const conversationId = `software:${crypto.randomUUID()}`;
    const response = await fetch(`${base}/api/showcase/chat`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        conversationId,
        context: [{ id: "address" }],
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [
              {
                type: "text",
                text: "Use prepare_action with actionId improve to draft a clear label for the selected optional address field. Keep it short.",
              },
            ],
          },
        ],
      }),
    });
    expect(response.status).toBe(200);
    const stream = await response.text();
    expect(stream).toContain('"type":"data-result"');
    const history = await call(
      `history?conversationId=${conversationId}`,
      cookie,
    );
    expect(
      history.messages.some((message: { parts: { type: string }[] }) =>
        message.parts.some((part) => part.type === "data-result"),
      ),
    ).toBe(true);
    expect(history.messages[0].metadata.schemaVersion).toBe(1);
  }, 60000);
  it.skipIf(process.env.SHOWCASE_LIVE_GITHUB !== "1")(
    "creates and verifies a real issue with a screenshot in the dedicated demo repository",
    async () => {
      const cookie = await session();
      const title = `Showcase integration verification ${new Date().toISOString()}`;
      const preview = await call("preview", cookie, {
        scenario: "software",
        actionId: "issue",
        objectId: "checkout",
        values: {
          title,
          text: "Automated integration verification using synthetic checkout data. The attached 1px PNG is a test fixture for the upload path. No production application or user data is included.",
        },
        screenshot:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1sAAAAASUVORK5CYII=",
      });
      const input = {
        previewId: preview.id,
        idempotencyKey: crypto.randomUUID(),
      };
      const receipt = await call("execute", cookie, input);
      expect(receipt.status, receipt.message).toBe("succeeded");
      expect(receipt.url).toMatch(
        /^https:\/\/github.com\/ewjdev\/anyclick-showcase-demo\/issues\/\d+$/,
      );
      const issueNumber = receipt.url.split("/").at(-1);
      const issue = await fetch(
        `https://api.github.com/repos/ewjdev/anyclick-showcase-demo/issues/${issueNumber}`,
      ).then((response) => response.json());
      expect(issue.title).toBe(title);
      expect(issue.body).toContain(`anyclick-execution:${receipt.id}`);
      expect(issue.body).toContain("element.png");
      const asset = await fetch(receipt.assetUrl);
      expect(asset.ok).toBe(true);
      expect((await call("execute", cookie, input)).url).toBe(receipt.url);
      console.log(`Verified demo issue: ${receipt.url}`);
    },
    60000,
  );
});
