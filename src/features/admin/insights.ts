import type { AdminUserRow } from "./api";

/**
 * All the derived metrics we can compute client-side from what /admin/users
 * already returns. Keeps the backend simple; the client does the analytics.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

export type Insights = {
  headline: {
    users: number;
    active7d: number;
    active30d: number;
    opens: number;
    /** Users whose lastSeenAt is within 7 days as a % of total. */
    retention7dPct: number;
    /** Mean opens across all users. */
    avgOpens: number;
    /** Median opens — more robust to power users than the mean. */
    medianOpens: number;
    /** Users with 3+ opens (a proxy for "actually stuck around"). */
    engagedUsers: number;
    /** Signups in the trailing 7 days. */
    newThisWeek: number;
    /** Signups in the trailing 30 days. */
    newThisMonth: number;
  };

  /** Last-30-days signup histogram — one bar per day, oldest → newest. */
  signupSparkline: { day: string; count: number }[];

  /** How many users fall into each opens bucket. */
  engagement: {
    label: string;
    range: [number, number];
    count: number;
  }[];

  /** Top 5 regions with a "Other" bucket for the tail. */
  regions: { region: string; count: number }[];

  /** Very inactive slice — flags users who haven't been seen in > 14 days
   *  but aren't first-day new. Useful for a "wake them up" push. */
  atRiskCount: number;

  /** Never-active — signed up but zero opens. */
  ghostCount: number;
};

export function computeInsights(rows: AdminUserRow[]): Insights {
  const now = Date.now();
  const week = now - 7 * DAY_MS;
  const month = now - 30 * DAY_MS;
  const fortnight = now - 14 * DAY_MS;

  let active7d = 0;
  let active30d = 0;
  let engagedUsers = 0;
  let newThisWeek = 0;
  let newThisMonth = 0;
  let atRisk = 0;
  let ghost = 0;
  let openSum = 0;

  const opens: number[] = [];
  const signupsByDay = new Map<string, number>();
  const regionCounts = new Map<string, number>();

  // 30-day frame for the signup sparkline. Pre-seed every day so bars for
  // no-signup days render as zero rather than getting skipped.
  for (let i = 29; i >= 0; i--) {
    signupsByDay.set(isoDay(now - i * DAY_MS), 0);
  }

  for (const r of rows) {
    opens.push(r.opens);
    openSum += r.opens;

    const seenAt = r.lastSeenAt ? Date.parse(r.lastSeenAt) : NaN;
    if (Number.isFinite(seenAt)) {
      if (seenAt >= week) active7d += 1;
      if (seenAt >= month) active30d += 1;
      if (seenAt < fortnight && r.opens > 0) atRisk += 1;
    }

    if (r.opens >= 3) engagedUsers += 1;
    if (r.opens === 0) ghost += 1;

    const joined = r.joinedAt ? Date.parse(r.joinedAt) : NaN;
    if (Number.isFinite(joined)) {
      if (joined >= week) newThisWeek += 1;
      if (joined >= month) newThisMonth += 1;
      const key = isoDay(joined);
      if (signupsByDay.has(key)) {
        signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
      }
    }

    const region = r.region?.trim() || "Unknown";
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }

  const users = rows.length;

  // Median — sort a copy so we don't disturb the source order.
  const sorted = [...opens].sort((a, b) => a - b);
  const medianOpens =
    sorted.length === 0
      ? 0
      : sorted.length % 2
      ? sorted[(sorted.length - 1) >> 1]
      : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);

  const engagement = [
    { label: "Zero", range: [0, 0] as [number, number], count: 0 },
    { label: "1–2", range: [1, 2] as [number, number], count: 0 },
    { label: "3–5", range: [3, 5] as [number, number], count: 0 },
    { label: "6–20", range: [6, 20] as [number, number], count: 0 },
    { label: "20+", range: [21, Infinity] as [number, number], count: 0 },
  ];
  for (const o of opens) {
    for (const b of engagement) {
      if (o >= b.range[0] && o <= b.range[1]) {
        b.count += 1;
        break;
      }
    }
  }

  // Top 5 regions with a rolled-up "Other" bucket.
  const regionsSorted = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const top = regionsSorted.slice(0, 5);
  const rest = regionsSorted.slice(5);
  const regions = top.map(([region, count]) => ({ region, count }));
  if (rest.length > 0) {
    regions.push({
      region: "Other",
      count: rest.reduce((s, [, c]) => s + c, 0),
    });
  }

  const signupSparkline = [...signupsByDay.entries()].map(([day, count]) => ({
    day,
    count,
  }));

  return {
    headline: {
      users,
      active7d,
      active30d,
      opens: rows.reduce((s, r) => s + r.opens, 0),
      retention7dPct: users === 0 ? 0 : Math.round((active7d / users) * 100),
      avgOpens: users === 0 ? 0 : Math.round(openSum / users),
      medianOpens,
      engagedUsers,
      newThisWeek,
      newThisMonth,
    },
    signupSparkline,
    engagement,
    regions,
    atRiskCount: atRisk,
    ghostCount: ghost,
  };
}
