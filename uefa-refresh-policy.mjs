export const MATCHDAY_WINDOWS = [
  { number: 1, start: "2026-09-08", end: "2026-09-10" },
  { number: 2, start: "2026-10-13", end: "2026-10-14" },
  { number: 3, start: "2026-10-20", end: "2026-10-21" },
  { number: 4, start: "2026-11-03", end: "2026-11-04" },
  { number: 5, start: "2026-11-24", end: "2026-11-25" },
  { number: 6, start: "2026-12-08", end: "2026-12-09" },
  { number: 7, start: "2027-01-19", end: "2027-01-20" },
  { number: 8, start: "2027-01-27", end: "2027-01-27" },
];

const beijingDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" });

export function shanghaiDateString(time = Date.now()) {
  const parts = beijingDate.formatToParts(time);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addCalendarDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Daily checks keep the latest round that has actually started overnight in China.
export function refreshMatchday(windows, today) {
  return [...windows].reverse().find((window) =>
    today >= addCalendarDays(window.start, 1)
  )?.number ?? null;
}

export function scheduledRefreshMatchday(windows, today) {
  return windows.find((window) =>
    today >= addCalendarDays(window.start, 1)
      && today <= addCalendarDays(window.end, 1)
  )?.number ?? null;
}

export function sameSnapshotData(previous, next) {
  const dataOnly = ({ generatedAt, scheduledRefreshDate, ...data }) => data;
  return JSON.stringify(dataOnly(previous)) === JSON.stringify(dataOnly(next));
}

export function scheduledRefreshCompleted(snapshot, matchday, today) {
  if (Number(snapshot.matchday) !== matchday) return false;
  if (snapshot.scheduledRefreshDate === today) return true;
  const generatedAt = Date.parse(snapshot.generatedAt);
  return generatedAt >= Date.parse(`${today}T09:00:00+08:00`)
    && generatedAt < Date.parse(`${addCalendarDays(today, 1)}T00:00:00+08:00`);
}
