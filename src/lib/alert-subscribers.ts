import * as fs from "fs";
import * as path from "path";
import type { Asset } from "@/lib/types";

const FILE = path.join(process.cwd(), "data", "alert-subscribers.json");

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface AlertSubscription {
  email: string;
  /** If all of tags, areas, types are empty/omitted → receive every CRITICAL alert. */
  tags?: string[];
  areas?: string[];
  types?: string[];
}

export function isValidEmail(email: string): boolean {
  const t = email.trim().toLowerCase();
  return t.length > 3 && t.length < 254 && EMAIL_RE.test(t);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normKey(s: string): string {
  return s.trim().toLowerCase();
}

function cleanList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()))];
}

function isGlobalRule(rule: AlertSubscription): boolean {
  const t = rule.tags?.length ?? 0;
  const a = rule.areas?.length ?? 0;
  const ty = rule.types?.length ?? 0;
  return t === 0 && a === 0 && ty === 0;
}

/** Critical asset matches subscription filters (empty dimension = no filter on that axis). */
export function subscriptionMatchesAssets(
  rule: AlertSubscription,
  criticalTags: string[],
  assetByTag: Map<string, Pick<Asset, "tag" | "area" | "type">>
): boolean {
  if (isGlobalRule(rule)) return criticalTags.length > 0;

  return criticalTags.some((tag) => {
    const meta = assetByTag.get(tag);
    if (!meta) return false;

    const wantTags = cleanList(rule.tags || []);
    const wantAreas = cleanList(rule.areas || []).map(normKey);
    const wantTypes = cleanList(rule.types || []).map(normKey);

    const tagOk =
      wantTags.length === 0 ||
      wantTags.some((w) => w.toUpperCase() === meta.tag.toUpperCase());
    const areaOk =
      wantAreas.length === 0 || wantAreas.includes(normKey(meta.area || ""));
    const typeOk =
      wantTypes.length === 0 || wantTypes.includes(normKey(meta.type || ""));

    return tagOk && areaOk && typeOk;
  });
}

function parseSubscriptions(raw: unknown): AlertSubscription[] {
  if (!Array.isArray(raw)) return [];

  const out: AlertSubscription[] = [];

  for (const item of raw) {
    if (typeof item === "string" && isValidEmail(item)) {
      out.push({ email: normalizeEmail(item) });
      continue;
    }
    if (item && typeof item === "object" && "email" in item) {
      const email = String((item as { email: unknown }).email || "");
      if (!isValidEmail(email)) continue;
      const tags = cleanList((item as { tags?: unknown }).tags);
      const areas = cleanList((item as { areas?: unknown }).areas);
      const types = cleanList((item as { types?: unknown }).types);
      out.push({
        email: normalizeEmail(email),
        ...(tags.length ? { tags } : {}),
        ...(areas.length ? { areas } : {}),
        ...(types.length ? { types } : {}),
      });
    }
  }

  return dedupeByEmail(out);
}

/** Last rule wins per email. */
function dedupeByEmail(rules: AlertSubscription[]): AlertSubscription[] {
  const map = new Map<string, AlertSubscription>();
  for (const r of rules) {
    map.set(normalizeEmail(r.email), r);
  }
  return [...map.values()];
}

function readFileSubscriptions(): AlertSubscription[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, "utf-8");
    return parseSubscriptions(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function subscribersFromEnvGlobal(): AlertSubscription[] {
  const raw = process.env.ALERT_SUBSCRIBER_EMAILS || "";
  return raw
    .split(/[,;\s]+/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean)
    .filter((e) => isValidEmail(e))
    .map((email) => ({ email }));
}

function subscribersFromEnvRules(): AlertSubscription[] {
  const raw = process.env.ALERT_SUBSCRIBER_RULES?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseSubscriptions(parsed);
  } catch {
    return [];
  }
}

/** Combined rules: env global emails, env JSON rules, then file (file overrides same email from env if we dedupe - dedupeByEmail: file should win - actually order matters). */
export function getAllSubscriptions(): AlertSubscription[] {
  const fromGlobal = subscribersFromEnvGlobal();
  const fromRules = subscribersFromEnvRules();
  const fromFile = readFileSubscriptions();
  return dedupeByEmail([...fromGlobal, ...fromRules, ...fromFile]);
}

export function getRecipientsForCriticalAssets(
  criticalTags: string[],
  assets: Pick<Asset, "tag" | "area" | "type">[]
): string[] {
  const assetByTag = new Map(assets.map((a) => [a.tag, a]));
  const emails = new Set<string>();
  for (const rule of getAllSubscriptions()) {
    if (subscriptionMatchesAssets(rule, criticalTags, assetByTag)) {
      emails.add(rule.email);
    }
  }
  return [...emails];
}

export function addSubscription(rule: AlertSubscription): { ok: boolean; error?: string } {
  if (!isValidEmail(rule.email)) return { ok: false, error: "Invalid email address" };
  const normalized: AlertSubscription = {
    email: normalizeEmail(rule.email),
    tags: cleanList(rule.tags || []),
    areas: cleanList(rule.areas || []),
    types: cleanList(rule.types || []),
  };

  const next = dedupeByEmail([
    ...readFileSubscriptions().filter((r) => r.email !== normalized.email),
    normalized,
  ]);

  try {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2), "utf-8");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Could not save subscription (read-only deploy). Use ALERT_SUBSCRIBER_EMAILS / ALERT_SUBSCRIBER_RULES in server env.",
    };
  }
}

export function removeSubscriber(email: string): { ok: boolean; error?: string } {
  if (!isValidEmail(email)) return { ok: false, error: "Invalid email address" };
  const norm = normalizeEmail(email);
  const next = readFileSubscriptions().filter((r) => r.email !== norm);
  try {
    if (fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, JSON.stringify(next, null, 2), "utf-8");
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update subscription file" };
  }
}

/** @deprecated use getAllSubscriptions */
export function getAlertSubscribers(): string[] {
  return getAllSubscriptions().map((r) => r.email);
}
