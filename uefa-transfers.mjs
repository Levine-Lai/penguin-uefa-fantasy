function usedLimitless(record) {
  return record.chip === "LL" || record.transfers?.chip === "LL"
    || (record.cards?.LL?.used && Number(record.cards.LL.matchday) === Number(record.matchday));
}

export function buildTransfers(record, history) {
  const previousByRound = new Map(history
    .filter((item) => item.region === record.region && item.guid === record.guid
      && Number(item.matchday) < Number(record.matchday))
    .map((item) => [Number(item.matchday), item]));
  let previous = previousByRound.get(Number(record.matchday) - 1);
  // LL lasts one round. Compare against the permanent squad it temporarily replaced.
  while (previous && usedLimitless(previous)) {
    previous = previousByRound.get(Number(previous.matchday) - 1);
  }
  const incoming = [];
  const outgoing = [];
  if (previous && record.chip !== "LL") {
    const previousIds = new Set(previous.lineup.map((player) => Number(player.id)));
    const currentIds = new Set(record.lineup.map((player) => Number(player.id)));
    const detail = ({ id, name, position }) => ({ id, name, position });
    incoming.push(...record.lineup.filter((player) => !previousIds.has(Number(player.id))).map(detail));
    outgoing.push(...previous.lineup.filter((player) => !currentIds.has(Number(player.id))).map(detail));
  }
  return {
    count: record.chip === "LL" ? 0
      : previous ? Math.max(incoming.length, outgoing.length) : Number(record.transferCount) || 0,
    penalty: record.transferPenalty,
    chip: record.chip,
    incoming,
    outgoing,
  };
}
