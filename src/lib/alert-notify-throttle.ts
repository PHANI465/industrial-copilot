/** In-memory throttle (best-effort on serverless; reduces duplicate bursts). */
const lastSent = new Map<string, number>();

const COOLDOWN_MS = 10 * 60 * 1000;

export function shouldSendAlert(signature: string): boolean {
  const now = Date.now();
  const prev = lastSent.get(signature) ?? 0;
  if (now - prev < COOLDOWN_MS) return false;
  lastSent.set(signature, now);
  return true;
}
