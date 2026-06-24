export const REGIONS = {
  IN: {
    id: "IN",
    label: "India",
    flag: "🇮🇳",
    currencySymbol: "₹",
    locale: "en-IN",
    speechLang: "en-IN",
    budgetMin: 100000,
    budgetMax: 50000000,
    bedroomLabel: "BHK",
    locations: ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad"],
    budgetOptions: ["2500000", "5000000", "7500000", "10000000"],
    locationHint: "Choose a city or type your own (e.g. Mumbai, Delhi)",
    budgetHint: "Say or type (e.g. paanch lakh, 50 lakh)",
    oneShotHint: "One shot: Mumbai mein 50 lakh mein 2 BHK",
    budgetVoiceExamples: "paanch lakh, pachaas lakh, or 5000000",    locationExamples: "Mumbai, Delhi, Bangalore",
    comparePlaceholder: "e.g. Mumbai, 50 lakh, 3 BHK",
  },
  US: {
    id: "US",
    label: "United States",
    flag: "🇺🇸",
    currencySymbol: "$",
    locale: "en-US",
    speechLang: "en-US",
    budgetMin: 50000,
    budgetMax: 5000000,
    bedroomLabel: "Bed",
    locations: ["New York", "Miami", "Austin", "Dallas", "Chicago"],
    budgetOptions: ["250000", "500000", "750000", "1000000"],
    locationHint: "Choose a city or type your own (e.g. New York, Miami)",
    budgetHint: "Say or type amount (e.g. 500000, five hundred thousand)",
    oneShotHint: "Or search in one go: Miami 500000 2 bed",
    budgetVoiceExamples: "500000, five hundred thousand, or 1 million",
    locationExamples: "New York, Miami, Austin",
    comparePlaceholder: "e.g. New York, 450000, 3 bed",
  },
};

export const DEFAULT_REGION = "IN";

export function getRegionConfig(region = DEFAULT_REGION) {
  return REGIONS[region] || REGIONS[DEFAULT_REGION];
}

export function formatPrice(region, value) {
  const config = getRegionConfig(region);
  return `${config.currencySymbol}${Number(value).toLocaleString(config.locale)}`;
}

export function isValidRegion(region) {
  return region === "IN" || region === "US";
}
