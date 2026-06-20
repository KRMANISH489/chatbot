import React from "react";

function BrandLogo({ size = "md", showTagline = false, light = false }) {
  return (
    <div className={`brand-logo brand-logo--${size} ${light ? "brand-logo--light" : ""}`}>
      <svg className="brand-logo__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="14" className="brand-logo__bg" />
        <path
          d="M24 10L36 20V36H30V26H18V36H12V20L24 10Z"
          className="brand-logo__house"
        />
        <circle cx="24" cy="22" r="2.5" className="brand-logo__dot" />
        <path d="M14 36H34" className="brand-logo__line" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="brand-logo__text">
        <span className="brand-logo__name">
          Agent <em>Mira</em>
        </span>
        {showTagline && <span className="brand-logo__tagline">Premium Real Estate</span>}
      </div>
    </div>
  );
}

export default BrandLogo;
