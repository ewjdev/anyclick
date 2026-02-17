import { createGitHubAdapter, defaultFormatTitle, } from "@ewjdev/anyclick-github/server";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function parseGitHubRepo(repoValue) {
    const [owner, repo] = repoValue.split("/");
    if (!owner || !repo) {
        throw new Error(`GITHUB_REPO is not in valid format. Expected \"owner/repo\", got \"${repoValue}\"`);
    }
    return { owner, repo };
}
function readPreferredTitle(metadata) {
    if (!isRecord(metadata))
        return undefined;
    const github = metadata.github;
    if (!isRecord(github))
        return undefined;
    const preferredTitle = github.title;
    if (typeof preferredTitle !== "string")
        return undefined;
    const trimmed = preferredTitle.trim();
    return trimmed || undefined;
}
function withRoutingMetadata(metadata) {
    const baseMetadata = isRecord(metadata) ? metadata : {};
    const routing = isRecord(baseMetadata.routing) ? baseMetadata.routing : {};
    return {
        ...baseMetadata,
        routing: {
            ...routing,
            adapter: "github",
        },
    };
}
export async function POST(req) {
    let payload;
    try {
        payload = (await req.json());
    }
    catch {
        return Response.json({
            success: false,
            error: "Invalid JSON payload",
        }, { status: 400 });
    }
    const token = process.env.GITHUB_TOKEN;
    const repoValue = process.env.GITHUB_REPO ?? "ewjdev/anyclick";
    if (!token) {
        return Response.json({
            success: false,
            error: "GITHUB_TOKEN is not configured. Set GITHUB_TOKEN in your environment.",
        }, { status: 500 });
    }
    try {
        const { owner, repo } = parseGitHubRepo(repoValue);
        const githubAdapter = createGitHubAdapter({
            owner,
            repo,
            token,
            formatTitle: (issuePayload) => readPreferredTitle(issuePayload.metadata) || defaultFormatTitle(issuePayload),
        });
        const normalizedPayload = {
            ...payload,
            metadata: withRoutingMetadata(payload.metadata),
        };
        const issue = await githubAdapter.createIssue(normalizedPayload);
        return Response.json({
            success: true,
            issue,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create GitHub issue";
        return Response.json({
            success: false,
            error: errorMessage,
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map