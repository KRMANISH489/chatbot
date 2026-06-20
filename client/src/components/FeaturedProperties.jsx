import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/properties";
const FALLBACK_IMAGE = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg";

function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .post(API_URL, {})
      .then((res) => setProperties((res.data || []).slice(0, 6)))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="landing-section featured-section" id="properties">
      <div className="landing-container">
        <div className="section-intro">
          <span className="section-label">Featured Listings</span>
          <h2>Handpicked Properties For You</h2>
          <p>Explore premium homes across top cities — verified listings with full details.</p>
        </div>

        {loading ? (
          <div className="properties-loading">Loading properties...</div>
        ) : (
          <div className="featured-grid">
            {properties.map((prop) => (
              <article className="featured-card" key={prop.id}>
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
                    ₹{Number(prop.price).toLocaleString("en-IN")}
                  </p>
                  <div className="featured-card__meta">
                    <span>{prop.bathrooms} Baths</span>
                    <span>{prop.size_sqft} sq ft</span>
                  </div>
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
