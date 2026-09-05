import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";

const path = process.env.SHOWCASE_ENV_FILE || ".env.local";
if (existsSync(path))
  Object.assign(process.env, dotenv.parse(readFileSync(path)));
const required = [
  "OPENAI_API_KEY",
  "QUICKCHAT_KV_REST_API_URL",
  "QUICKCHAT_KV_REST_API_TOKEN",
  "SHOWCASE_DAILY_TOKEN_BUDGET",
  "SHOWCASE_GITHUB_TOKEN",
  "SHOWCASE_GITHUB_REPO",
];
let failed = false;
for (const name of required) {
  const present = Boolean(process.env[name]);
  console.log(`${present ? "OK" : "MISSING"} ${name}`);
  if (!present) failed = true;
}
if (
  !Number.isSafeInteger(Number(process.env.SHOWCASE_DAILY_TOKEN_BUDGET)) ||
  Number(process.env.SHOWCASE_DAILY_TOKEN_BUDGET) <= 0
) {
  console.log("INVALID daily token budget");
  failed = true;
}
if (failed) process.exit(1);
const { Redis } = await import("@upstash/redis");
try {
  const redis = new Redis({
    url: process.env.QUICKCHAT_KV_REST_API_URL,
    token: process.env.QUICKCHAT_KV_REST_API_TOKEN,
  });
  await redis.ping();
  console.log("OK Redis connection");
} catch {
  console.log("FAILED Redis connection");
  failed = true;
}
const repo = process.env.SHOWCASE_GITHUB_REPO;
if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.log("INVALID demo repository");
  process.exit(1);
}
for (const suffix of ["", "/branches/issues%2Fsrc"]) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}${suffix}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SHOWCASE_GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  const data = await response.json();
  const valid =
    response.ok &&
    (suffix || (data.private === false && data.has_issues === true));
  console.log(
    `${valid ? "OK" : "FAILED"} GitHub ${suffix ? "media branch" : "public demo repository"}`,
  );
  if (!valid) failed = true;
}
console.log(
  "Token write permissions and live AI output must also pass the explicit integration smoke test. This preflight performs no external writes.",
);
process.exitCode = failed ? 1 : 0;
