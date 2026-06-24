import { getApiBase, isLocalHost } from "./apiConfig";

export function getHealthUrl() {
  const base = getApiBase();
  if (base) return `${base}/health`;
  if (typeof window !== "undefined") return `${window.location.origin}/health`;
  return "/health";
}

export async function checkApiHealth() {
  if (isLocalHost()) {
    return { ok: true, reason: "local-dev" };
  }

  try {
    const res = await fetch(getHealthUrl(), {
      headers: { Accept: "application/json" },
    });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false, reason: "html" };
    }
    const data = await res.json();
    return { ok: data.status === "ok", reason: data.status };
  } catch {
    return { ok: false, reason: "network" };
  }
}
