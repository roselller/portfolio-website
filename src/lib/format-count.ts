// Short counts for small labels: 999 stays "999", 10,000 becomes "10K".
const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(count: number): string {
  return compact.format(count);
}
