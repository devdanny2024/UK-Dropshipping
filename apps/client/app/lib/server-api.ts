const rawBackendBase = process.env.BACKEND_HTTP_BASE_URL?.trim();

function normalizeBackendBase() {
  if (!rawBackendBase) return null;
  try {
    const url = new URL(rawBackendBase);
    return url.origin;
  } catch {
    return null;
  }
}

export const backendBase = normalizeBackendBase();

export async function fetchJsonSafe<T>(path: string): Promise<T | null> {
  if (!backendBase) {
    console.warn('[server-api] BACKEND_HTTP_BASE_URL is missing or invalid');
    return null;
  }

  try {
    const res = await fetch(`${backendBase}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('[server-api] upstream request failed', { path, status: res.status });
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error('[server-api] fetch failed', {
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
