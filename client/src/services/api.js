const baseURL = import.meta.env.VITE_API_URL;
/**
 * Core request function - Pure fetch wrapper
 */
const request = async (endpoint, options = {}) => {
  const config = {
    method: "GET",
    credentials: "include", // Keep cookies for auth
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${baseURL}${endpoint}`, config);

  // Parse JSON (even on error responses)
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || "API request failed";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Public API methods
 */
export const api = {
  get(endpoint, options = {}) {
    return request(endpoint, { method: "GET", ...options });
  },

  post(endpoint, body, options = {}) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  },

  put(endpoint, body, options = {}) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch(endpoint, body, options = {}) {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, { method: "DELETE", ...options });
  },

  // Raw request access (if needed)
  request,
};
