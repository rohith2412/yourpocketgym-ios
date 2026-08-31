/**
 * Product analytics — app opens and screen views.
 *
 * Events are queued in memory and flushed in small batches, so navigating
 * around the app doesn't fire a request per screen. Everything here is
 * best-effort: a failed flush drops the batch rather than retrying forever or
 * surfacing an error, because analytics must never affect the app the user
 * sees.
 *
 * Nothing here touches location services. "Where" a user is comes from the
 * region they chose during onboarding.
 */

import { AppState, type AppStateStatus } from "react-native";
import { api } from "../../api/client";
import { getSecureToken } from "../../lib/storage";

type EventType = "app_open" | "screen_view";

type QueuedEvent = {
  type: EventType;
  screen?: string;
  at: string;
};

const FLUSH_AT = 10; // batch size that triggers an immediate flush
const FLUSH_EVERY_MS = 30_000;
const MAX_QUEUE = 50; // hard cap, so an offline session can't grow unbounded

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let lastScreen: string | null = null;

async function flush() {
  if (queue.length === 0) return;
  // Signed-out users have nothing to attribute events to.
  const token = await getSecureToken();
  if (!token) {
    queue = [];
    return;
  }

  const batch = queue;
  queue = [];
  try {
    await api.post("/analytics/event", { events: batch });
  } catch {
    // Dropped on purpose. Re-queuing risks a growing backlog of stale events
    // on a flaky connection, and none of this is worth that.
  }
}

function enqueue(e: QueuedEvent) {
  queue.push(e);
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= FLUSH_AT) void flush();
}

export function trackAppOpen() {
  enqueue({ type: "app_open", at: new Date().toISOString() });
}

export function trackScreen(screen: string) {
  // Tab switches can fire the same route repeatedly; only record changes.
  if (!screen || screen === lastScreen) return;
  lastScreen = screen;
  enqueue({ type: "screen_view", screen, at: new Date().toISOString() });
}

/** Start the flush timer and re-open tracking. Call once, at app root. */
export function startAnalytics() {
  if (timer) return () => {};

  trackAppOpen();
  timer = setInterval(() => void flush(), FLUSH_EVERY_MS);

  const onAppState = (state: AppStateStatus) => {
    if (state === "active") trackAppOpen();
    // Background is the last reliable moment to get events off the device.
    if (state === "background") void flush();
  };
  const sub = AppState.addEventListener("change", onAppState);

  return () => {
    sub.remove();
    if (timer) clearInterval(timer);
    timer = null;
    void flush();
  };
}
