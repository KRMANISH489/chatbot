import React from "react";
import { BRAND } from "../brandConfig";
import "./BrandLogo.scss";

function BrandLogo({ size = "md", showTagline = false, light = false, iconOnly = false, variant }) {
  return (
    <div
      className={`brand-logo brand-logo--${size} ${light ? "brand-logo--light" : ""} ${
        iconOnly ? "brand-logo--icon-only" : ""
      } ${variant ? `brand-logo--${variant}` : ""}`}
    >
      <svg className="brand-logo__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="10" className="brand-logo__mark-bg" />
        <path
          d="M16 8.5L23.5 14.5V22.5H19.5V17.5H12.5V22.5H8.5V14.5L16 8.5Z"
          className="brand-logo__mark-home"
        />
        <path d="M13.5 22.5V18.5L16 16.5L18.5 18.5V22.5" className="brand-logo__mark-door" />
        <circle cx="16" cy="13.5" r="1.2" className="brand-logo__mark-accent" />
      </svg>

      {!iconOnly && (
        <div className="brand-logo__text">
          <span className="brand-logo__name">
            {BRAND.assistant}
            <span className="brand-logo__suffix"> Real Estate</span>
          </span>
          {showTagline && <span className="brand-logo__tagline">{BRAND.tagline}</span>}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
