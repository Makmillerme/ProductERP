/**
 * Клієнт для маршрутів `/api/admin/*`: єдиний парсинг помилок з JSON `{ error }`.
 */

/** Шлях відносно `/api/admin`, напр. `/categories` або `/field-definitions?page=1`. */
export function adminApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/api/admin${normalized}`;
}

export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(adminApiPath(path), init);
}

export async function parseAdminErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string" &&
    (data as { error: string }).error
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

export async function adminGetJson<T = unknown>(path: string, fallbackError: string): Promise<T> {
  const res = await adminFetch(path, { method: "GET" });
  if (!res.ok) {
    throw new Error(await parseAdminErrorMessage(res, fallbackError));
  }
  return res.json() as Promise<T>;
}

export async function adminMutationJson<T = unknown>(
  path: string,
  options: {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    fallbackError: string;
  }
): Promise<T> {
  const { method, body, fallbackError } = options;
  const hasJsonBody = body !== undefined && method !== "DELETE";
  const res = await adminFetch(path, {
    method,
    headers: hasJsonBody ? { "Content-Type": "application/json" } : undefined,
    body: hasJsonBody ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(await parseAdminErrorMessage(res, fallbackError));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** DELETE ідемпотентний: 404 (вже видалено) не вважається помилкою. */
export async function adminDeleteAllowMissing(
  path: string,
  fallbackError: string,
): Promise<void> {
  const res = await adminFetch(path, { method: "DELETE" });
  if (res.ok || res.status === 404) return;
  throw new Error(await parseAdminErrorMessage(res, fallbackError));
}
