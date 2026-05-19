export const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      payload.message === "Server error." && payload.detail
        ? `${payload.message} ${payload.detail}`
        : payload.message || "Request failed.";
    const error = new Error(detail);
    error.payload = payload;
    throw error;
  }

  return payload;
}
