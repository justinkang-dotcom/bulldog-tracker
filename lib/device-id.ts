const KEY = "web-device-id";

let cached = "";

export function ensureDeviceId(): string {
  if (cached) return cached;
  if (typeof window === "undefined") return "";
  try {
    let existing = window.localStorage.getItem(KEY);
    if (!existing) {
      existing = crypto.randomUUID();
      window.localStorage.setItem(KEY, existing);
    }
    cached = existing;
    return existing;
  } catch {
    cached = cached || crypto.randomUUID();
    return cached;
  }
}
