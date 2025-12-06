import prompts from "prompts";
import { log } from "../utils/log.js";
import { customFieldIds } from "./cmd.js";
import { resolveJiraEnv, searchTeams } from "./jira.js";
import { GetJiraTeamDataParams, JiraEnv } from "./types.js";

export const getJiraUrl = async (path: string, env?: JiraEnv) => {
  const resolvedEnv = env || (await resolveJiraEnv());
  if (!resolvedEnv)
    throw new Error("Jira environment not configured error in getJiraUrl");
  // remove leading slash from path
  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  return `${resolvedEnv.jiraUrl}/${path}`;
};

export const getJiraAuth = async (env?: JiraEnv) => {
  const resolvedEnv = env || (await resolveJiraEnv());
  if (!resolvedEnv)
    throw new Error("Jira environment not configured error in getJiraAuth");
  return Buffer.from(`${resolvedEnv.email}:${resolvedEnv.apiToken}`).toString(
    "base64"
  );
};

type JiraFetchOpts = Parameters<typeof fetch>[1] & {
  env?: JiraEnv;
};
export const getJiraFetchOptions = async (
  path: string,
  { env, ...options }: JiraFetchOpts
) => {
  const url = await getJiraUrl(path, env);
  const resolvedEnv = env || (await resolveJiraEnv());
  if (!resolvedEnv)
    throw new Error(
      "Jira environment not configured error in getJiraFetchOptions"
    );

  const auth = await getJiraAuth(resolvedEnv);
  return {
    url,
    options: {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    },
  };
};

export const e = async ({ teamName, meta, env }: GetJiraTeamDataParams) => {
  let team = {
    id: undefined,
    name: undefined,
  };
  const teamFieldKey =
    Object.entries(meta).find(
      ([, m]: [string, any]) => (m?.name || "").toLowerCase() === "team"
    )?.[0] || customFieldIds.team;
  log.debug(`teamFieldKey: ${teamFieldKey}`);
  if (meta?.[teamFieldKey]) {
    const teamFieldName = meta[teamFieldKey]?.name || "Team";
    const preTeam = teamName || env.defaultTeam;
    if (!!preTeam) {
      log.debug(`searching for team: ${preTeam}`);
      const teams = await searchTeams(preTeam, teamFieldName, env);
      log.debug(`teams: ${JSON.stringify(teams, null, 2)}`);
      if (teams.length === 1) {
        team.id = teams[0].id;
        team.name = teams[0].name;
      } else {
        const { selected } = await prompts({
          type: "select",
          name: "selected",
          message: "Select Team",
          choices: teams.map((t) => ({
            title: `${t.name} (${t.id})`,
            value: t.id,
          })),
          initial: 0,
        });
        if (selected) log.info(`Selected team: ${selected}`);
        const selValue = selected?.value ?? selected;
        let teamValue: any = selValue;
        if (typeof selValue === "string") {
          const numericSuffix = selValue.match(/(\d+)$/)?.[1];
          if (numericSuffix) teamValue = Number(numericSuffix);
          else if (/^\d+$/.test(selValue)) teamValue = Number(selValue);
        }
        team.id = teamValue;
        team.name = teamValue;
      }
    } else {
      const { teamQuery } = await prompts({
        type: "text",
        name: "teamQuery",
        message: "Team (type part of team name)",
      });
      if (teamQuery) {
        const teams = await searchTeams(teamQuery, teamFieldName, env);
        if (teams.length > 0) {
          if (teams.length === 1) {
            // if only one team found, use it
            team.id = teams[0].id;
            team.name = teams[0].name;
          } else {
            const { selected } = await prompts({
              type: "select",
              name: "selected",
              message: "Select Team",
              choices: teams.map((t) => ({
                title: `${t.name} (${t.id})`,
                value: t.id,
              })),
              initial: 0,
            });
            if (selected) log.info(`Selected team: ${selected}`);
            const selValue = (selected as any).value ?? selected;
            let teamValue: any = selValue;
            if (typeof selValue === "string") {
              const numericSuffix = selValue.match(/(\d+)$/)?.[1];
              if (numericSuffix) teamValue = Number(numericSuffix);
              else if (/^\d+$/.test(selValue)) teamValue = Number(selValue);
            }
            team.id = teamValue;
            team.name = teamValue;
          }
        } else {
          log.warn("No teams found matching your query.");
        }
      }
    }
  }
  return team;
};
