import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("./dashboard.js", import.meta.url), "utf8");
const snapshot = JSON.parse(readFileSync(new URL("./uefa-live-data.js", import.meta.url), "utf8")
  .replace(/^window\.PENGUIN_UEFA_SNAPSHOT\s*=\s*/, "").replace(/;\s*$/, ""));
const functionSource = source.slice(source.indexOf("function expectedSquad("), source.indexOf("function scoreBoardHtml("));

test("future squads restore pre-LL lineups and retain ordinary current squads", () => {
  const scores = { arctic: {}, antarctic: {} };
  for (const record of snapshot.records) {
    scores[record.region][`${record.matchday}|${record.guid}`] = record;
  }
  const expectedSquad = runInNewContext(`${functionSource}; expectedSquad`, {
    snapshotRound: snapshot.matchday, managerScoresByRegion: scores,
  });
  for (const current of snapshot.records.filter((record) => record.matchday === snapshot.matchday)) {
    let baseline = current;
    while (baseline?.chip === "LL") {
      baseline = scores[current.region][`${baseline.matchday - 1}|${current.guid}`];
    }
    assert.equal(expectedSquad(current.guid, current.region), baseline);
  }
  const tierney = expectedSquad("7649f634-a5a9-11f1-ad1f-b33810b58db2", "antarctic");
  assert.equal(tierney.matchday, 2);
  assert.ok(tierney.lineup.some((player) => player.name === "D. Raya"));
  assert.equal(expectedSquad("missing", "antarctic"), null);
});
