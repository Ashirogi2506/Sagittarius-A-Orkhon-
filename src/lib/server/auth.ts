import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { batch, bump, get, nowIso, run } from "./db";
import { env } from "./env";

const COOKIE = "so_session";
const SESSION_DAYS = 30;

export interface User { id: number; name: string; email: string; area: string | null; role: "user" | "admin"; createdAt: string }

// Passwords: scrypt with a per-user salt. Stored as "scrypt$<salt hex>$<hash hex>".
export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = scryptSync(pw, Buffer.from(saltHex, "hex"), want.length);
  return timingSafeEqual(want, got);
}

// Session tokens: random, only their SHA-256 is stored, so a leaked DB cannot be used to log in.
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

const adminEmails = () => env("ADMIN_EMAILS").split(",").map((s) => s.replace(/[﻿​-‍⁠]/g, "").trim().toLowerCase()).filter(Boolean);

type Row = { id: number; name: string; email: string; area: string | null; role: string; created_at: string };
const toUser = (r: Row): User => ({
  id: r.id, name: r.name, email: r.email, area: r.area, createdAt: r.created_at,
  role: r.role === "admin" || adminEmails().includes(r.email) ? "admin" : "user",
});

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", sha(token), userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", expires,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await run("DELETE FROM sessions WHERE token = ?", sha(t));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t || t.length > 100) return null;
  const r = await get<Row>(
    "SELECT u.id, u.name, u.email, u.area, u.role, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?",
    sha(t), nowIso(),
  );
  return r ? toUser(r) : null;
}

export function findUserByEmail(email: string) {
  return get<Row & { pass: string }>("SELECT id, name, email, area, role, created_at, pass FROM users WHERE email = ?", email);
}

export async function createUser(name: string, email: string, password: string, area: string | null): Promise<User> {
  const created = nowIso();
  const res = await run("INSERT INTO users (name, email, pass, area, created_at) VALUES (?, ?, ?, ?, ?)", name, email, hashPassword(password), area, created);
  await batch([bump("users")]);
  return toUser({ id: Number(res.lastInsertRowid), name, email, area, role: "user", created_at: created });
}

export const publicUser = (r: Row) => toUser(r);
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
