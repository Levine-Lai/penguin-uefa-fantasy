export function addCalendarDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Allow catch-up runs for two days after the last fixture night.
export function refreshMatchday(windows, today) {
  return [...windows].reverse().find((window) =>
    today >= addCalendarDays(window.start, 1) && today <= addCalendarDays(window.end, 3)
  )?.number ?? null;
}

export function sameSnapshotData(previous, next) {
  const dataOnly = ({ generatedAt, scheduledRefreshDate, ...data }) => data;
  return JSON.stringify(dataOnly(previous)) === JSON.stringify(dataOnly(next));
}
