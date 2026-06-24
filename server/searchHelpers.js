function exactFilter(merged, { region, location, budget, bedrooms }) {
  return merged.filter((p) =>
    (!region || p.region === region) &&
    (!location || p.location.toLowerCase().includes(String(location).toLowerCase())) &&
    (!budget || parseInt(p.price, 10) <= parseInt(budget, 10)) &&
    (!bedrooms || parseInt(p.bedrooms, 10) === parseInt(bedrooms, 10))
  );
}

function similarFilter(merged, { region, location, budget, bedrooms }) {
  let pool = merged.filter((p) => !region || p.region === region);

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

  const rangePct = region === "IN" ? 0.45 : 0.3;
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

function searchProperties(merged, criteria) {
  const exact = exactFilter(merged, criteria);
  if (exact.length > 0) {
    return { properties: exact, matchType: "exact" };
  }

  const similar = similarFilter(merged, criteria);
  if (similar.length > 0) {
    return { properties: similar, matchType: "similar_range" };
  }

  return { properties: [], matchType: "none" };
}

module.exports = { searchProperties };
