/**
 * Centralized HTTP client communicating with backend /api endpoints.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("peoplepay360_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = endpoint.startsWith("http") ? endpoint : endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`;

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("text/html")) {
      const text = await res.text();
      return { success: true, data: text };
    }

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error?.message || data.message || "An unexpected error occurred";
      const err = new Error(errorMsg);
      err.code = data.error?.code || "API_ERROR";
      err.details = data.error?.details;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export default apiRequest;
