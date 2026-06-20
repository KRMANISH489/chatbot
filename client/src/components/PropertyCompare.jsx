import React, { useState } from "react";
import axios from "axios";
import "./PropertyCompare.scss";

const API_URL = "http://localhost:5000/api/properties";

const COMPARE_FIELDS = [
  { key: "title", label: "Property" },
  { key: "price", label: "Price", format: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
  { key: "location", label: "Location" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "size_sqft", label: "Size", format: (v) => `${v} sq ft` },
  { key: "amenities", label: "Amenities", format: (v) => v?.join(", ") || "—" },
];

function parseSearchInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const bedroomMatch = trimmed.match(/^(\d+)\s*(bhk|bed|bedroom|bedrooms|house|room|rooms)?$/i);
  if (bedroomMatch) {
    const num = parseInt(bedroomMatch[1], 10);
    if (num >= 1 && num <= 10) {
      return { bedrooms: String(num), type: "bedrooms" };
    }
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  const isNumeric = digitsOnly.length > 0 && digitsOnly.length === trimmed.replace(/[\s,₹$]/g, "").length;

  if (isNumeric) {
    const num = parseInt(digitsOnly, 10);
    if (num >= 1 && num <= 10) {
      return { bedrooms: String(num), type: "bedrooms" };
    }
    return { budget: String(num), type: "price" };
  }

  return { location: trimmed, type: "location" };
}

function getInputHint(parsed) {
  if (!parsed) return "";
  if (parsed.type === "price") return "Detected: Price";
  if (parsed.type === "bedrooms") return "Detected: House / Bedrooms";
  return "Detected: Location";
}

async function findProperty(rawInput) {
  const criteria = parseSearchInput(rawInput);
  if (!criteria) return null;

  const res = await axios.post(API_URL, {
    location: criteria.location || undefined,
    budget: criteria.budget || undefined,
    bedrooms: criteria.bedrooms || undefined,
  });

  if (!res.data.length) return null;

  if (criteria.budget) {
    const budget = parseInt(criteria.budget, 10);
    return res.data.reduce((best, prop) => {
      const bestDiff = Math.abs(best.price - budget);
      const propDiff = Math.abs(prop.price - budget);
      return propDiff < bestDiff ? prop : best;
    });
  }

  return res.data[0];
}

function PropertyCompare() {
  const [property1Input, setProperty1Input] = useState("");
  const [property2Input, setProperty2Input] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!property1Input.trim() || !property2Input.trim()) {
      setError("Please enter value for both Property 1 and Property 2.");
      setCompareResult(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [prop1, prop2] = await Promise.all([
        findProperty(property1Input),
        findProperty(property2Input),
      ]);

      if (!prop1 && !prop2) {
        setError("No properties found for either search.");
        setCompareResult(null);
      } else if (!prop1) {
        setError("No property found for Property 1.");
        setCompareResult({ prop1: null, prop2 });
      } else if (!prop2) {
        setError("No property found for Property 2.");
        setCompareResult({ prop1, prop2: null });
      } else {
        setCompareResult({ prop1, prop2 });
      }
    } catch {
      setError("Failed to fetch properties. Make sure the server is running.");
      setCompareResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (field, property) => {
    if (!property) return "—";
    const value = property[field.key];
    if (field.format) return field.format(value);
    return value ?? "—";
  };

  const renderInputForm = (side, value, onChange) => {
    const parsed = parseSearchInput(value);

    return (
      <div className="compare-input-card">
        <h3>Property {side}</h3>
        <label>
          Enter location, price, or house (bedrooms)
          <input
            type="text"
            placeholder="e.g. New York, 450000, 3 BHK"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        {value.trim() && <span className="input-hint">{getInputHint(parsed)}</span>}
      </div>
    );
  };

  return (
    <section className="property-compare">
      <div className="section-header">
        <h2>Compare Properties</h2>
        <p>One input for each property — type location, price, or house — then click Compare.</p>
      </div>

      <div className="compare-inputs">
        {renderInputForm(1, property1Input, setProperty1Input)}
        <div className="compare-vs">VS</div>
        {renderInputForm(2, property2Input, setProperty2Input)}
      </div>

      <button
        type="button"
        className="compare-submit-btn"
        onClick={handleCompare}
        disabled={loading}
      >
        {loading ? "Searching..." : "Compare Properties"}
      </button>

      {error && <p className="compare-error">{error}</p>}

      {compareResult && (compareResult.prop1 || compareResult.prop2) && (
        <div className="compare-results">
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>
                    {compareResult.prop1 ? (
                      <>
                        <img src={compareResult.prop1.image_url} alt={compareResult.prop1.title} />
                        <span>{compareResult.prop1.title}</span>
                      </>
                    ) : (
                      <span className="not-found">Not Found</span>
                    )}
                  </th>
                  <th>
                    {compareResult.prop2 ? (
                      <>
                        <img src={compareResult.prop2.image_url} alt={compareResult.prop2.title} />
                        <span>{compareResult.prop2.title}</span>
                      </>
                    ) : (
                      <span className="not-found">Not Found</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_FIELDS.map((field) => (
                  <tr key={field.key}>
                    <td>{field.label}</td>
                    <td>{renderValue(field, compareResult.prop1)}</td>
                    <td>{renderValue(field, compareResult.prop2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default PropertyCompare;
