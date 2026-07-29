/**
 * Sorts items by a canonical id-order array (written in one shot by a drag
 * reorder), falling back to `fallbackCompare` for any items not yet present in
 * that array — e.g. items created before the order array existed, or by a
 * client that doesn't write it yet.
 */
export function applyOrder<T>(
  items: T[],
  getId: (item: T) => string,
  orderIds: string[] | undefined,
  fallbackCompare: (a: T, b: T) => number
): T[] {
  if (!orderIds || orderIds.length === 0) {
    return [...items].sort(fallbackCompare);
  }
  const rank = new Map(orderIds.map((id, index) => [id, index]));
  const known: T[] = [];
  const unknown: T[] = [];
  for (const item of items) {
    (rank.has(getId(item)) ? known : unknown).push(item);
  }
  known.sort((a, b) => rank.get(getId(a))! - rank.get(getId(b))!);
  unknown.sort(fallbackCompare);
  return [...known, ...unknown];
}
