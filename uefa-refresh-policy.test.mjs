import test from "node:test";
import assert from "node:assert/strict";
import { refreshMatchday, scheduledRefreshMatchday, scheduledRefreshCompleted, sameSnapshotData } from "./uefa-refresh-policy.mjs";

const windows = [{ number: 3, start: "2026-10-20", end: "2026-10-21" }];
test("fallback skips successful runs but retries stale days and wrong rounds", () => {
  const snapshot = { matchday: 4, generatedAt: "2026-11-05T01:00:00Z" };
  assert.equal(scheduledRefreshCompleted(snapshot, 4, "2026-11-05"), true);
  assert.equal(scheduledRefreshCompleted({ ...snapshot, generatedAt: "2026-11-05T00:59:59Z" }, 4, "2026-11-05"), false);
  assert.equal(scheduledRefreshCompleted(snapshot, 4, "2026-11-06"), false);
  assert.equal(scheduledRefreshCompleted(snapshot, 5, "2026-11-05"), false);
  assert.equal(scheduledRefreshCompleted({ ...snapshot, generatedAt: "invalid" }, 4, "2026-11-05"), false);
  assert.equal(scheduledRefreshCompleted({ matchday: 4, scheduledRefreshDate: "2026-11-05" }, 4, "2026-11-05"), true);
  assert.equal(scheduledRefreshCompleted({ ...snapshot, generatedAt: "2026-11-05T16:00:00Z" }, 4, "2026-11-05"), false);
});
test("scheduled refresh only runs on mornings after match nights", () => {
  assert.equal(scheduledRefreshMatchday(windows, "2026-10-20"), null);
  assert.equal(scheduledRefreshMatchday(windows, "2026-10-21"), 3);
  assert.equal(scheduledRefreshMatchday(windows, "2026-10-22"), 3);
  assert.equal(scheduledRefreshMatchday(windows, "2026-10-23"), null);
  const single = [{ number: 8, start: "2027-01-27", end: "2027-01-27" }];
  assert.equal(scheduledRefreshMatchday(single, "2027-01-28"), 8);
  assert.equal(scheduledRefreshMatchday(single, "2027-01-29"), null);
});
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
