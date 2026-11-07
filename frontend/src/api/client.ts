/** Calls to the Pramaan backend. Components never call fetch directly; they use src/api/hooks. */

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, "Can't reach the Pramaan server. Check your connection, or wait a minute if it was asleep.");
  }
  if (!response.ok) throw new ApiError(response.status, `Request failed (${response.status}).`);
  return (await response.json()) as T;
}

export interface Health {
  ok: boolean;
  reader_mode: string;
}

export const getHealth = () => apiFetch<Health>("/health");
