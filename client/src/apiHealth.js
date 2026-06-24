export async function checkApiHealth() {
  try {
    const res = await fetch("/health", {
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
