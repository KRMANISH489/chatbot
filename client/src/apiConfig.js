function trimSlash(url) {
  return url.replace(/\/$/, "");
}

export function isLocalHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function getApiBase() {
  if (typeof window !== "undefined" && window.__API_BASE__ !== undefined) {
    const base = String(window.__API_BASE__);
    if (!base) return "";
    return trimSlash(base);
  }

  if (process.env.REACT_APP_API_URL) {
    return trimSlash(process.env.REACT_APP_API_URL);
  }

  if (typeof window !== "undefined" && !isLocalHost()) {
    return "";
  }

  return "http://localhost:5000";
}

function apiUrl(path) {
  const base = getApiBase();
  return base ? `${base}${path}` : path;
}

export function getPropertiesApiUrl() {
  return apiUrl("/api/properties");
}

export function getLeadsApiUrl() {
  return apiUrl("/api/leads");
}
