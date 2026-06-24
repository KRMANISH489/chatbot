(function () {
  if (window.__API_BASE__ !== undefined) return;
  var host = window.location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1";
  window.__API_BASE__ = isLocal ? "http://localhost:5000" : "";
})();
