import React from "react";
import { REGIONS } from "../regionConfig";
import "./RegionSwitcher.scss";

function RegionSwitcher({ region, onRegionChange, compact = false }) {
  return (
    <div className={`region-switcher ${compact ? "compact" : ""}`} role="group" aria-label="Select market">
      {Object.values(REGIONS).map((r) => (
        <button
          key={r.id}
          type="button"
          className={region === r.id ? "active" : ""}
          onClick={() => onRegionChange(r.id)}
          aria-pressed={region === r.id}
        >
          <span className="region-switcher__flag">{r.flag}</span>
          <span className="region-switcher__label">{compact ? r.id : r.label}</span>
        </button>
      ))}
    </div>
  );
}

export default RegionSwitcher;
