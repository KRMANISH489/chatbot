// Local dev default — production overwrites this in build/ on `npm run serve`
if (!window.__API_BASE__) {
  window.__API_BASE__ = "http://localhost:5000";
}
