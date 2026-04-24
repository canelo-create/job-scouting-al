/**
 * Minimal SerpApi HTTP client.
 * Docs: https://serpapi.com/search-api
 */

const BASE = "https://serpapi.com";

export class SerpApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "SerpApiError";
  }
}

export type SerpApiParams = Record<string, string | number | undefined>;

export async function serpapiFetch<T = unknown>(
  path: string,
  params: SerpApiParams = {},
): Promise<T> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new SerpApiError("SERPAPI_KEY missing", 500);

  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new SerpApiError(
      `SerpApi ${path} → HTTP ${res.status}`,
      res.status,
      body,
    );
  }
  return body as T;
}
