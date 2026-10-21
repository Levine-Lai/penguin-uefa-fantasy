import test from "node:test";
import assert from "node:assert/strict";
import { refreshMatchday, sameSnapshotData } from "./uefa-refresh-policy.mjs";

const windows = [{ number: 3, start: "2026-10-20", end: "2026-10-21" }];
test("GD3 refreshes after each fixture night and catches delayed runs", () => {
  assert.equal(refreshMatchday(windows, "2026-10-20"), null);
  for (const date of ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"]) {
    assert.equal(refreshMatchday(windows, date), 3);
  }
  assert.equal(refreshMatchday(windows, "2026-10-25"), null);
});
test("later corrections are saved but unchanged fallback checks are not", () => {
  const previous = { matchday: 3, generatedAt: "old", scheduledRefreshDate: "old", records: [{ score: 12 }] };
  assert.equal(sameSnapshotData(previous, { ...previous, generatedAt: "new", scheduledRefreshDate: "new" }), true);
  assert.equal(sameSnapshotData(previous, { ...previous, records: [{ score: 15 }] }), false);
  assert.equal(sameSnapshotData(previous, { ...previous, matchday: 4 }), false);
});
