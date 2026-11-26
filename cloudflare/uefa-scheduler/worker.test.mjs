import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

test("Cloudflare only dispatches on a match morning without an active or successful run", async (t) => {
  const matchMorning = new Date("2026-12-09T01:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now: matchMorning });
  const event = { scheduledTime: matchMorning.getTime() };
  const env = { GITHUB_ACTIONS_TOKEN: "test-token" };
  const runName = "Cloudflare UEFA refresh 2026-12-09";
  let runs = [];
  const dispatches = [];
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    if (new URL(url).pathname.endsWith("/runs")) return Response.json({ workflow_runs: runs });
    assert.equal(new URL(url).pathname.endsWith("/dispatches"), true);
    assert.equal(options.method, "POST");
    dispatches.push(JSON.parse(options.body));
    return new Response(null, { status: 204 });
  });

  await worker.scheduled({ scheduledTime: Date.parse("2026-12-08T01:00:00Z") }, env);
  assert.equal(fetch.mock.callCount(), 0);
  await worker.scheduled(event, env);
  assert.deepEqual(dispatches, [{ ref: "main", inputs: { scheduled_date: "2026-12-09" } }]);

  for (const [status, conclusion] of [["queued", null], ["in_progress", null], ["completed", "success"]]) {
    runs = [{ display_title: runName, status, conclusion }];
    await worker.scheduled(event, env);
  }
  assert.equal(dispatches.length, 1);

  runs = [{ display_title: runName, status: "completed", conclusion: "failure" }];
  await worker.scheduled(event, env);
  assert.equal(dispatches.length, 2);
});
