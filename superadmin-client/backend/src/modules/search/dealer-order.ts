/** Input is newest first with a unique ID tie-breaker. Keep that order within each dealer. */
export function interleaveDealers(rows: { id: string; dealerId: string }[]): string[] {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const group = groups.get(row.dealerId);
    if (group) group.push(row.id);
    else groups.set(row.dealerId, [row.id]);
  }
  let active = [...groups.values()];
  const ordered: string[] = [];
  for (let round = 0; active.length; round++) {
    const next: string[][] = [];
    for (const group of active) {
      ordered.push(group[round]);
      if (group.length > round + 1) next.push(group);
    }
    active = next;
  }
  return ordered;
}
