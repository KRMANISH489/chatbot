import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatPrice } from "../regionConfig";
import { BRAND } from "../brandConfig";
import { getPropertiesApiUrl } from "../apiConfig";
import { parsePropertyApiResponse } from "./chatHelpers";

const FALLBACK_IMAGE = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg";

function FeaturedProperties({ region, onAskAboutProperty }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .post(getPropertiesApiUrl(), { region })
      .then((res) => setProperties(parsePropertyApiResponse(res.data).properties.slice(0, 6)))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [region]);

  return (
    <section className="landing-section featured-section" id="properties">
      <div className="landing-container">
        <div className="section-intro">
          <span className="section-label">Featured Listings</span>
          <h2>Handpicked Properties For You</h2>
          <p>Tap any property to ask {BRAND.assistant} about it in chat.</p>
        </div>

        {loading ? (
          <div className="properties-loading">Loading properties...</div>
        ) : (
          <div className="featured-grid">
            {properties.map((prop) => (
              <article
                className="featured-card featured-card--clickable"
                key={prop.id}
                role="button"
                tabIndex={0}
                onClick={() => onAskAboutProperty?.(prop)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onAskAboutProperty?.(prop);
                }}
              >
                <div className="featured-card__image">
                  <img
                    src={prop.image_url}
                    alt={prop.title}
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  <span className="featured-card__badge">{prop.bedrooms} BHK</span>
                </div>
                <div className="featured-card__body">
                  <h3>{prop.title}</h3>
                  <p className="featured-card__location">{prop.location}</p>
                  <p className="featured-card__price">
                    {formatPrice(region, prop.price)}
                  </p>
                  <div className="featured-card__meta">
                    <span>{prop.bathrooms} Baths</span>
                    <span>{prop.size_sqft} sq ft</span>
                  </div>
                  <span className="featured-card__cta">Ask {BRAND.assistant} about this →</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProperties;
