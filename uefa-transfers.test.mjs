import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTransfers } from "./uefa-transfers.mjs";

const snapshot = JSON.parse(readFileSync(new URL("./uefa-live-data.js", import.meta.url), "utf8")
  .replace(/^window\.PENGUIN_UEFA_SNAPSHOT\s*=\s*/, "").replace(/;\s*$/, ""));
test("GD3 after LL compares with the permanent GD1 squad", () => {
  for (const guid of ["36dc5ee0-a7f4-11f1-a746-c39d9f6e388a", "1e2a95e8-aa0f-11f1-90b3-fdbab094db3a"]) {
    const record = snapshot.records.find((item) => item.guid === guid && item.matchday === 3);
    const result = buildTransfers(record, snapshot.records);
    assert.equal(result.count, 2);
    assert.equal(result.incoming.length, 2);
    assert.equal(result.outgoing.length, 2);
    assert.equal(result.penalty, 0);
    assert.equal(result.chip, null);
    if (guid.startsWith("36dc")) {
      assert.deepEqual(result.incoming.map((player) => player.name).sort(), ["E. N'Dicka", "Sergi Altimira"]);
      assert.deepEqual(result.outgoing.map((player) => player.name).sort(), ["R. Calafiori", "Xavi Espart"]);
    }
  }
});
test("LL itself has no transfer list; WC uses the preceding permanent squad", () => {
  const base = { region: "test", guid: "member", matchday: 1, chip: null, lineup: [{ id: 1, position: 2 }] };
  const current = { ...base, matchday: 2, chip: "LL", transferCount: 0, transferPenalty: 0, lineup: [{ id: 2, position: 2 }] };
  assert.deepEqual(buildTransfers(current, [base]), { count: 0, penalty: 0, chip: "LL", incoming: [], outgoing: [] });
  const wildcard = buildTransfers({ ...current, chip: "WC" }, [base]);
  assert.equal(wildcard.count, 1);
  assert.equal(wildcard.chip, "WC");
});
test("missing pre-LL history falls back to official count without invented transfers", () => {
  const record = { region: "test", guid: "member", matchday: 3, chip: null, transferCount: 2, transferPenalty: -4, lineup: [{ id: 3 }] };
  const previous = { ...record, matchday: 2, chip: "LL", lineup: [{ id: 2 }] };
  assert.deepEqual(buildTransfers(record, [previous]), { count: 2, penalty: -4, chip: null, incoming: [], outgoing: [] });
});
