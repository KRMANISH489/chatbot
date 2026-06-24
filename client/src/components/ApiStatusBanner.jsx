import React, { useEffect, useState } from "react";
import { checkApiHealth } from "../apiHealth";
import "./ApiStatusBanner.scss";

function ApiStatusBanner() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    checkApiHealth().then((result) => {
      if (active) setStatus(result.ok ? "ok" : result.reason);
    });
    return () => {
      active = false;
    };
  }, []);

  if (status === "checking" || status === "ok") return null;

  return (
    <div className="api-status-banner" role="alert">
      <strong>Backend not connected.</strong>{" "}
      {status === "html"
        ? "Backend API is not running. Wait for Railway deploy to finish or redeploy the service."
        : "Please check your connection or refresh the page."}
    </div>
  );
}

export default ApiStatusBanner;
