/** Base fetch wrapper — attaches JWT token when available */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function getToken() {
  try {
    return localStorage.getItem("krypton_token");
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (networkErr) {
    throw new ApiError(
      0,
      "Cannot reach backend. Check API base URL, deployment status, and CORS ALLOWED_ORIGINS.",
    );
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.error ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }

  return res.json();
}
