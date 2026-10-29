// Storage and API contracts remain in seconds; human-facing course times use minutes.
export function formatMinutes(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value / 60)} phút`;
}
