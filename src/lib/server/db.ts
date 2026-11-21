import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client, type InStatement, type InValue, type ResultSet } from "@libsql/client";
import { env } from "./env";

// SQLite everywhere:
//  - locally: a file, ./data/smart-orkhon.db (override with DB_PATH)
//  - in production (Vercel etc.): a free Turso database, set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
// The SQL is the same in both cases. Stored: accounts, citizen reports, urgent notices. AI questions are not stored.
// Traffic is NOT stored: it is fetched live from the camera centre and refreshed every 5 minutes.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass TEXT NOT NULL,
  area TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
-- AI questions used to be kept here; they are no longer stored, and the old ones are removed.
DROP TABLE IF EXISTS chat_logs;
CREATE TABLE IF NOT EXISTS reports (
  tracking TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  photo TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  history TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_created ON reports(created_at);
CREATE INDEX IF NOT EXISTS reports_user ON reports(user_id, created_at);
-- Running totals (users), so totals never need a full-table COUNT(*).
CREATE TABLE IF NOT EXISTS counters (
  key TEXT PRIMARY KEY,
  n INTEGER NOT NULL
);
DELETE FROM counters WHERE key = 'questions';
CREATE TABLE IF NOT EXISTS garbage_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sum TEXT NOT NULL,
  bag TEXT,
  area TEXT,
  days TEXT NOT NULL,
  time_from TEXT,
  time_to TEXT,
  note TEXT,
  source TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);
-- Urgent notices posted by admins (outages, emergencies). Outages with a point are drawn on the map.
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  area TEXT,
  lat REAL,
  lng REAL,
  starts_at TEXT,
  ends_at TEXT,
  closed_at TEXT,
  source TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS alerts_open ON alerts(closed_at, created_at);
-- City bus routes, entered by admins from the operator's official timetable.
CREATE TABLE IF NOT EXISTS bus_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  name TEXT,
  stops TEXT NOT NULL,
  first_time TEXT,
  last_time TEXT,
  interval_min INTEGER,
  fare_adult INTEGER,
  fare_child INTEGER,
  fare_note TEXT,
  source TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);
`;

/** Totals kept in `counters`, and the table each one starts from the first time. */
const COUNTERS = { users: "users" } as const;
export type CounterKey = keyof typeof COUNTERS;

/** Statement that adds `by` to a running total. Put it in the same batch as the insert it counts. */
export const bump = (key: CounterKey, by = 1): InStatement => ({
  sql: "INSERT INTO counters (key, n) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET n = n + excluded.n",
  args: [key, by],
});

/** Start any missing running total from the rows that already exist (runs once per total). */
async function migrate(c: Client) {
  const have = new Set((await c.execute("SELECT key FROM counters")).rows.map((r) => String(r[0])));
  const missing = (Object.keys(COUNTERS) as CounterKey[]).filter((k) => !have.has(k));
  if (missing.length) {
    await c.batch(missing.map((k) => ({ sql: `INSERT OR IGNORE INTO counters (key, n) SELECT ?, COUNT(*) FROM ${COUNTERS[k]}`, args: [k] })), "write");
  }
}

async function open(): Promise<Client> {
  const remote = env("TURSO_DATABASE_URL");
  let c: Client;
  if (remote) {
    c = createClient({ url: remote, authToken: env("TURSO_AUTH_TOKEN") });
    await c.executeMultiple(SCHEMA);
  } else {
    const file = process.env.DB_PATH || path.join(process.cwd(), "data", "smart-orkhon.db");
    mkdirSync(path.dirname(file), { recursive: true });
    c = createClient({ url: "file:" + file.replace(/\\/g, "/") });
    await c.executeMultiple("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;" + SCHEMA);
  }
  await migrate(c);
  return c;
}

const g = globalThis as unknown as { __soDb?: Promise<Client> };

/** Shared client, opened (and schema created) once per server process. */
export function client(): Promise<Client> {
  if (!g.__soDb) g.__soDb = open().catch((e) => { g.__soDb = undefined; throw e; });
  return g.__soDb;
}

// Plain objects (column name -> value), so rows serialise cleanly to JSON.
const plain = <T,>(r: ResultSet) => r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]]))) as T[];

export async function all<T>(sql: string, ...args: InValue[]): Promise<T[]> {
  return plain<T>(await (await client()).execute({ sql, args }));
}

export async function get<T>(sql: string, ...args: InValue[]): Promise<T | undefined> {
  return (await all<T>(sql, ...args))[0];
}

export async function run(sql: string, ...args: InValue[]): Promise<{ changes: number; lastInsertRowid: number }> {
  const r = await (await client()).execute({ sql, args });
  return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid ?? 0) };
}

/** Several writes in one round trip (one transaction, one connection). Returns rows affected per statement. */
export async function batch(stmts: InStatement[]): Promise<number[]> {
  if (!stmts.length) return [];
  return (await (await client()).batch(stmts, "write")).map((r) => r.rowsAffected);
}

export const nowIso = () => new Date().toISOString();
