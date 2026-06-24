function trimSlash(url) {
  return url.replace(/\/$/, "");
}

export function getApiBase() {
  if (typeof window !== "undefined" && window.__API_BASE__) {
    return trimSlash(window.__API_BASE__);
  }

  if (process.env.REACT_APP_API_URL) {
    return trimSlash(process.env.REACT_APP_API_URL);
  }

  return "http://localhost:5000";
}

export function getPropertiesApiUrl() {
  return `${getApiBase()}/api/properties`;
}

export function getLeadsApiUrl() {
  return `${getApiBase()}/api/leads`;
}
