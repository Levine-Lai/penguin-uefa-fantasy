import { MATCHDAY_WINDOWS, scheduledRefreshMatchday, shanghaiDateString } from "../../uefa-refresh-policy.mjs";

const workflow = "https://api.github.com/repos/Levine-Lai/penguin-uefa-fantasy/actions/workflows/update-uefa-data.yml";

export default {
  async scheduled(event, env) {
    const date = shanghaiDateString(event.scheduledTime);
    if (date !== shanghaiDateString() || !scheduledRefreshMatchday(MATCHDAY_WINDOWS, date)) {
      console.log(`No UEFA refresh due for ${date}.`);
      return;
    }
    if (!env.GITHUB_ACTIONS_TOKEN) throw new Error("Missing GITHUB_ACTIONS_TOKEN binding.");

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_ACTIONS_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "penguin-uefa-scheduler",
    };
    const query = new URLSearchParams({ event: "workflow_dispatch", branch: "main", per_page: "20" });
    const runs = await fetch(`${workflow}/runs?${query}`, { headers, redirect: "manual" });
    if (!runs.ok) throw new Error(`GitHub workflow lookup failed (HTTP ${runs.status}).`);
    const { workflow_runs: recentRuns } = await runs.json();
    const runName = `Cloudflare UEFA refresh ${date}`;
    if (recentRuns.some((run) => run.display_title === runName
        && (run.status !== "completed" || run.conclusion === "success"))) {
      console.log(`${runName} already started or succeeded.`);
      return;
    }

    const dispatch = await fetch(`${workflow}/dispatches`, {
      method: "POST",
      headers,
      redirect: "manual",
      body: JSON.stringify({ ref: "main", inputs: { scheduled_date: date } }),
    });
    if (!dispatch.ok) throw new Error(`GitHub workflow dispatch failed (HTTP ${dispatch.status}).`);
    console.log(`${runName} was accepted by GitHub.`);
  },
};
