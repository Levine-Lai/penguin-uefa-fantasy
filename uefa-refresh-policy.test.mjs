import test from "node:test";
import assert from "node:assert/strict";
import { refreshMatchday, sameSnapshotData } from "./uefa-refresh-policy.mjs";

const windows = [{ number: 3, start: "2026-10-20", end: "2026-10-21" }];
test("daily checks keep GD3 even on non-matchdays", () => {
  assert.equal(refreshMatchday(windows, "2026-10-20"), null);
  for (const date of ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"]) {
    assert.equal(refreshMatchday(windows, date), 3);
  }
  assert.equal(refreshMatchday(windows, "2026-10-25"), 3);
  const later = [...windows, { number: 4, start: "2026-11-03", end: "2026-11-04" }];
  assert.equal(refreshMatchday(later, "2026-11-03"), 3);
  assert.equal(refreshMatchday(later, "2026-11-04"), 4);
});
test("later corrections are saved but unchanged fallback checks are not", () => {
  const previous = { matchday: 3, generatedAt: "old", scheduledRefreshDate: "old", records: [{ score: 12 }] };
  assert.equal(sameSnapshotData(previous, { ...previous, generatedAt: "new", scheduledRefreshDate: "new" }), true);
  assert.equal(sameSnapshotData(previous, { ...previous, records: [{ score: 15 }] }), false);
  assert.equal(sameSnapshotData(previous, { ...previous, matchday: 4 }), false);
});
