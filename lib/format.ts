export function formatTimeLeft(expiresAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60_000));
  if (minutes <= 0) return "Expired";
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h left` : `${hours}h ${rest}m left`;
}

export function minutesLeft(expiresAt: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 60_000));
}

export function isFading(expiresAt: number, now = Date.now()): boolean {
  return minutesLeft(expiresAt, now) <= 10 && minutesLeft(expiresAt, now) > 0;
}
