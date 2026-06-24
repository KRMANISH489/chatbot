function normalizeRegion(region) {
  if (!region) return null;
  const value = String(region).toUpperCase();
  return value === "IN" || value === "US" ? value : null;
}

function exactFilter(merged, { region, location, budget, bedrooms }) {
  const normalizedRegion = normalizeRegion(region);
  return merged.filter((p) =>
    (!normalizedRegion || p.region === normalizedRegion) &&
    (!location || p.location.toLowerCase().includes(String(location).toLowerCase())) &&
    (!budget || parseInt(p.price, 10) <= parseInt(budget, 10)) &&
    (!bedrooms || parseInt(p.bedrooms, 10) === parseInt(bedrooms, 10))
  );
}

function similarFilter(merged, { region, location, budget, bedrooms }) {
  const normalizedRegion = normalizeRegion(region);
  let pool = merged.filter((p) => !normalizedRegion || p.region === normalizedRegion);

  if (location) {
    const loc = String(location).toLowerCase();
    const inLocation = pool.filter((p) => p.location.toLowerCase().includes(loc));
    if (inLocation.length > 0) pool = inLocation;
  }

  const budgetNum = parseInt(budget, 10);
  if (!budgetNum || Number.isNaN(budgetNum)) {
    let result = pool;
    if (bedrooms) {
      const bedMatch = pool.filter((p) => parseInt(p.bedrooms, 10) === parseInt(bedrooms, 10));
      if (bedMatch.length) result = bedMatch;
    }
    return result.slice(0, 6);
  }

  const rangePct = normalizedRegion === "IN" ? 0.45 : 0.3;
  const minPrice = budgetNum * (1 - rangePct);
  const maxPrice = budgetNum * (1 + rangePct);

  let candidates = pool.filter((p) => {
    const price = parseInt(p.price, 10);
    return price >= minPrice && price <= maxPrice;
  });

  if (bedrooms) {
    const withBedrooms = candidates.filter(
      (p) => parseInt(p.bedrooms, 10) === parseInt(bedrooms, 10)
    );
    if (withBedrooms.length) candidates = withBedrooms;
  }

  candidates.sort(
    (a, b) => Math.abs(a.price - budgetNum) - Math.abs(b.price - budgetNum)
  );

  if (candidates.length === 0) {
    candidates = [...pool]
      .sort((a, b) => Math.abs(a.price - budgetNum) - Math.abs(b.price - budgetNum))
      .slice(0, 5);
  }

  return candidates.slice(0, 6);
}

function regionFallback(merged, region) {
  const normalizedRegion = normalizeRegion(region) || "IN";
  const pool = merged.filter((p) => p.region === normalizedRegion);
  return pool.slice(0, 6);
}

function searchProperties(merged, criteria) {
  const normalized = { ...criteria, region: normalizeRegion(criteria.region) || "IN" };

  const exact = exactFilter(merged, normalized);
  if (exact.length > 0) {
    return { properties: exact, matchType: "exact" };
  }

  const similar = similarFilter(merged, normalized);
  if (similar.length > 0) {
    return { properties: similar, matchType: "similar_range" };
  }

  const fallback = regionFallback(merged, normalized.region);
  if (fallback.length > 0) {
    return { properties: fallback, matchType: "broad_fallback" };
  }

  return { properties: merged.slice(0, 6), matchType: "broad_fallback" };
}

module.exports = { searchProperties, normalizeRegion };
