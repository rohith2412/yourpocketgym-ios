/**
 * gymDb.js — Central SQLite store for all app data except meal logs.
 *
 * Tables:
 *   workout_logs  — tracking page (workout sessions)
 *   saved_plans   — AI trainer saved plans
 *   kv_cache      — generic TTL cache (profile, user-intro, recipes library)
 */

import * as SQLite from "expo-sqlite";

let _db = null;

function getDb() {
  if (!_db) {
    _db = SQLite.openDatabaseSync("gym.db");
    _db.execSync(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id           TEXT PRIMARY KEY,
        date         TEXT NOT NULL,
        exercises_json TEXT NOT NULL,
        notes        TEXT,
        created_at   TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date DESC);

      CREATE TABLE IF NOT EXISTS saved_plans (
        id        TEXT PRIMARY KEY,
        plan_json TEXT NOT NULL,
        saved_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kv_cache (
        key        TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        expires_at TEXT
      );
    `);
  }
  return _db;
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────

export function saveWorkoutLog(log) {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO workout_logs (id, date, exercises_json, notes)
     VALUES (?, ?, ?, ?)`,
    [
      String(log._id ?? log.id),
      log.date,
      JSON.stringify(log.exercises ?? []),
      log.notes ?? null,
    ]
  );
}

export function saveWorkoutLogs(logs) {
  const db = getDb();
  // Bulk-replace in a transaction — fast even for 400 logs
  db.withTransactionSync(() => {
    for (const log of logs) {
      db.runSync(
        `INSERT OR REPLACE INTO workout_logs (id, date, exercises_json, notes)
         VALUES (?, ?, ?, ?)`,
        [String(log._id ?? log.id), log.date, JSON.stringify(log.exercises ?? []), log.notes ?? null]
      );
    }
  });
}

export function getAllWorkoutLogs() {
  const db = getDb();
  const rows = db.getAllSync(
    `SELECT * FROM workout_logs ORDER BY date DESC`
  );
  return rows.map(rowToWorkout);
}

export function deleteWorkoutLog(id) {
  const db = getDb();
  db.runSync(`DELETE FROM workout_logs WHERE id = ?`, [String(id)]);
}

function rowToWorkout(row) {
  return {
    _id:       row.id,
    date:      row.date,
    exercises: JSON.parse(row.exercises_json ?? "[]"),
    notes:     row.notes ?? "",
  };
}

// ─── Saved AI Plans ───────────────────────────────────────────────────────────

export function saveAIPlan(id, plan, savedAt) {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO saved_plans (id, plan_json, saved_at) VALUES (?, ?, ?)`,
    [String(id), JSON.stringify(plan), savedAt ?? new Date().toISOString()]
  );
}

export function saveBulkAIPlans(plans) {
  const db = getDb();
  db.withTransactionSync(() => {
    for (const sv of plans) {
      db.runSync(
        `INSERT OR REPLACE INTO saved_plans (id, plan_json, saved_at) VALUES (?, ?, ?)`,
        [String(sv._id), JSON.stringify(sv.plan), sv.savedAt]
      );
    }
  });
}

export function getAllSavedPlans() {
  const db = getDb();
  const rows = db.getAllSync(
    `SELECT * FROM saved_plans ORDER BY saved_at DESC`
  );
  return rows.map((r) => ({
    _id:     r.id,
    plan:    JSON.parse(r.plan_json ?? "{}"),
    savedAt: r.saved_at,
  }));
}

export function removeAIPlan(id) {
  const db = getDb();
  db.runSync(`DELETE FROM saved_plans WHERE id = ?`, [String(id)]);
}

// ─── Generic KV Cache ─────────────────────────────────────────────────────────

/**
 * Store any JSON value with an optional TTL in seconds.
 * Pass ttlSeconds = 0 to cache forever.
 */
export function cacheSet(key, value, ttlSeconds = 0) {
  const db = getDb();
  const expiresAt = ttlSeconds > 0
    ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
    : null;
  db.runSync(
    `INSERT OR REPLACE INTO kv_cache (key, value_json, expires_at) VALUES (?, ?, ?)`,
    [key, JSON.stringify(value), expiresAt]
  );
}

/**
 * Get a cached value. Returns null if missing or expired.
 */
export function cacheGet(key) {
  const db = getDb();
  const row = db.getFirstSync(
    `SELECT value_json, expires_at FROM kv_cache WHERE key = ?`,
    [key]
  );
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    db.runSync(`DELETE FROM kv_cache WHERE key = ?`, [key]);
    return null;
  }
  try { return JSON.parse(row.value_json); } catch { return null; }
}

export function cacheDelete(key) {
  const db = getDb();
  db.runSync(`DELETE FROM kv_cache WHERE key = ?`, [key]);
}
