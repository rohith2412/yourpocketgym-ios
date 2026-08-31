/**
 * Email + password auth. Hits the backend routes at:
 *   POST /api/auth/login    { email, password }
 *   POST /api/auth/register { name, email, password }
 * Both return { success, token, user: { id, name, email, hasIntro } }
 */

import { API_BASE_URL } from "../../api/client";
import type { AuthUser, Session } from "./session";

type Response = {
  success?: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
};

async function post(path: string, body: object): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Response;
  if (!res.ok || !data.token || !data.user) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return { token: data.token, user: data.user };
}

export function loginWithEmail(email: string, password: string): Promise<Session> {
  return post("/auth/login", { email: email.trim(), password });
}

export function registerWithEmail(name: string, email: string, password: string): Promise<Session> {
  return post("/auth/register", {
    name: name.trim(),
    email: email.trim(),
    password,
  });
}
