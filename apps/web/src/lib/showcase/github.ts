import type { Preview, Receipt } from "./actions";
import { DomainError } from "./domain";
import { type Session, acquire, key, storage } from "./storage";

function configuration() {
  const repo = process.env.SHOWCASE_GITHUB_REPO;
  const token = process.env.SHOWCASE_GITHUB_TOKEN;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !token)
    throw new DomainError("The demo GitHub integration is not connected.", 503);
  return { repo, token };
}
async function github(path: string, init: RequestInit = {}) {
  const { repo, token } = configuration();
  return fetch(`https://api.github.com/repos/${repo}/${path}`, {
    ...init,
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}
export async function saveReceipt(session: Session, receipt: Receipt) {
  await storage().set(key(session, `execution:${receipt.id}`), receipt, {
    ex:
      receipt.actionId === "issue"
        ? 7 * 86400
        : Math.max(1, Math.ceil((session.expiresAt - Date.now()) / 1000)),
  });
}
export async function reconcileIssue(
  session: Session,
  receipt: Receipt,
): Promise<Receipt> {
  if (receipt.status !== "outcome_unknown") return receipt;
  // Read the repository directly; search indexing is eventually consistent.
  const since = new Date(receipt.createdAt - 60_000).toISOString();
  for (let page = 1; page <= 3; page++) {
    const response = await github(
      `issues?state=all&sort=created&direction=desc&per_page=100&page=${page}&since=${encodeURIComponent(since)}`,
    );
    if (!response.ok) return receipt;
    const issues = (await response.json()) as {
      body?: string;
      html_url: string;
    }[];
    const match = issues.find((issue) =>
      issue.body?.includes(`<!-- anyclick-execution:${receipt.id} -->`),
    );
    if (match) {
      const complete: Receipt = {
        ...receipt,
        status: "succeeded",
        url: match.html_url,
        message: "Issue created in the demo repository.",
      };
      await saveReceipt(session, complete);
      return complete;
    }
    if (issues.length < 100) break;
  }
  return receipt; // Absence is not proof the POST failed; never silently create again.
}

export async function executeGitHub(
  session: Session,
  preview: Preview,
  receipt: Receipt,
): Promise<Receipt> {
  const { repo } = configuration();
  const release = await acquire(`showcase:github:${repo}:writer`, 80);
  let current = { ...receipt };
  try {
    if (preview.input.screenshot) {
      const path = `feedback-assets/${receipt.id}/element.png`;
      const branch = "issues/src";
      const previous = await github(
        `contents/${path}?ref=${encodeURIComponent(branch)}`,
      );
      if (!previous.ok && previous.status !== 404)
        throw new DomainError(
          "GitHub could not check the screenshot. Try again later.",
          503,
        );
      if (previous.status === 404) {
        current.stage = "asset";
        await saveReceipt(session, current);
        const upload = await github(`contents/${path}`, {
          method: "PUT",
          body: JSON.stringify({
            branch,
            message: `AnyClick demo capture ${receipt.id}`,
            content: preview.input.screenshot.split(",")[1],
          }),
        });
        if (!upload.ok)
          throw new DomainError(
            "GitHub could not store the screenshot. The demo media branch and Contents permission must be configured.",
            503,
          );
      }
      current.assetUrl = `https://github.com/${repo}/blob/${branch}/${path}?raw=true`;
      await saveReceipt(session, current);
    }
    const body = `${preview.input.values.text}\n\n### Selected sample object\n${preview.input.objectId}\n\n${Object.entries(
      preview.before,
    )
      .map(([name, value]) => `- ${name}: ${value}`)
      .join(
        "\n",
      )}${current.assetUrl ? `\n\n![Selected sample element](${current.assetUrl})` : "\n\nSubmitted without a screenshot."}\n\n<!-- anyclick-execution:${receipt.id} -->\n\nCreated from the AnyClick hosted sample workspace.`;
    current.stage = "issue";
    await saveReceipt(session, current);
    const response = await github("issues", {
      method: "POST",
      body: JSON.stringify({
        title: preview.input.values.title.slice(0, 200),
        body,
      }),
    });
    if (!response.ok) {
      if (response.status >= 500) throw new Error("Uncertain provider result");
      current = {
        ...current,
        status: "failed",
        message:
          response.status === 403 || response.status === 429
            ? "GitHub is limiting submissions or denying access. Wait before trying a new submission."
            : "GitHub rejected this issue. Review the draft and integration configuration.",
      };
    } else {
      const issue = (await response.json()) as { html_url: string };
      current = {
        ...current,
        status: "succeeded",
        url: issue.html_url,
        message: "Issue created in the demo repository.",
      };
    }
  } catch (error) {
    current = {
      ...current,
      status: current.stage === "issue" ? "outcome_unknown" : "failed",
      message:
        current.stage === "issue"
          ? "GitHub may have created the issue. Check the submission status before taking another action."
          : error instanceof DomainError
            ? error.message
            : "Screenshot upload could not be confirmed. No issue submission was attempted.",
    };
  } finally {
    await release();
  }
  await saveReceipt(session, current);
  return current;
}
