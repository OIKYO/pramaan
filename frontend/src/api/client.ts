/** Calls to the Pramaan backend, signed with the user's Supabase session.
 * Components never call fetch directly; they use the hooks in src/api/hooks. */
import { supabase } from "./supabase";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg ?? "Something in the form isn't valid.").join(" ");
    }
  } catch {
    // Not JSON; use the generic message below.
  }
  return `The server couldn't do that (error ${response.status}). Try again in a moment.`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Can't reach the Pramaan server. Check your connection. If the server was asleep, wait a minute and try again.",
    );
  }
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  return (await response.json()) as T;
}

export const postJson = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const postForm = <T>(path: string, form: FormData) => api<T>(path, { method: "POST", body: form });

export const getHealth = () => api<{ ok: boolean; reader_mode: string }>("/health");
