/**
 * mealDb.js — Local SQLite storage for meal logs.
 *
 * Why: After the AI scan API returns macro data, we persist it
 * here instead of keeping it only in MongoDB on the server.
 * Reads, deletes, and edits all happen locally — zero extra API calls.
 */

import * as SQLite from "expo-sqlite";

let _db = null;

function getDb() {
  if (!_db) {
    _db = SQLite.openDatabaseSync("gym_meals.db");
    _db.execSync(`
      CREATE TABLE IF NOT EXISTS meal_logs (
        id          TEXT PRIMARY KEY,
        date        TEXT NOT NULL,
        meal_type   TEXT NOT NULL,
        foods_json  TEXT NOT NULL,
        totals_json TEXT NOT NULL,
        ai_notes    TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date);
    `);
  }
  return _db;
}

/**
 * Save a meal log returned from the scan API.
 * log shape: { _id, date, mealType, foods, totals, aiNotes }
 */
export function saveMealLog(log) {
  const db = getDb();
  // Normalise date to YYYY-MM-DD for easy querying
  const date =
    typeof log.date === "string" && log.date.length >= 10
      ? log.date.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  db.runSync(
    `INSERT OR REPLACE INTO meal_logs
       (id, date, meal_type, foods_json, totals_json, ai_notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      log._id ?? log.id ?? String(Date.now()),
      date,
      log.mealType,
      JSON.stringify(log.foods ?? []),
      JSON.stringify(log.totals ?? {}),
      log.aiNotes ?? null,
    ]
  );
}

/**
 * Return all meal logs for a given YYYY-MM-DD date, newest first.
 */
export function getMealLogsByDate(dateISO) {
  const db = getDb();
  const rows = db.getAllSync(
    `SELECT * FROM meal_logs WHERE date = ? ORDER BY created_at DESC`,
    [dateISO]
  );
  return rows.map(rowToLog);
}

/**
 * Delete a meal log by id.
 */
export function deleteMealLog(id) {
  const db = getDb();
  db.runSync(`DELETE FROM meal_logs WHERE id = ?`, [id]);
}

/**
 * Update only the totals of a log (used by EditMacrosSheet).
 */
export function updateMealLogTotals(id, totals) {
  const db = getDb();
  db.runSync(
    `UPDATE meal_logs SET totals_json = ? WHERE id = ?`,
    [JSON.stringify(totals), id]
  );
}

/**
 * Convert a raw DB row back to the shape the UI expects.
 */
function rowToLog(row) {
  return {
    _id:      row.id,
    date:     row.date,
    mealType: row.meal_type,
    foods:    JSON.parse(row.foods_json ?? "[]"),
    totals:   JSON.parse(row.totals_json ?? "{}"),
    aiNotes:  row.ai_notes ?? "",
  };
}
