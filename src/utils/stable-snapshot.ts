/** API collections contain JSON data only. Reuse references when polling finds no change. */
export function reuseSnapshot<T>(previous: T, next: T): T {
  return previous === next || JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
}
