/**
 * Single typed API client for the yourpocketgym backend.
 * Every network call goes through here — one place for the base URL, auth
 * headers, and error handling. Feature code calls api.get/post, never fetch().
 */

import { getSecureToken } from "../lib/storage";

export const API_BASE_URL = "https://yourpocketgym.com/api";

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  /** Attach the stored auth token (default: true). */
  auth?: boolean;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const { auth = true, signal } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = await getSecureToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e: any) {
    throw new ApiError(
      "Network error. Check your connection.",
      0,
      e?.message,
    );
  }

  // Parse JSON defensively — the backend can return HTML on errors.
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        `Unexpected server response (${res.status})`,
        res.status,
        text.slice(0, 200),
      );
    }
  }

  if (!res.ok || (data && data.success === false)) {
    throw new ApiError(
      data?.error || `Request failed (${res.status})`,
      res.status,
      data,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};
