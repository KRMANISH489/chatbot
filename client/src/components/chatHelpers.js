import { getRegionConfig, formatPrice, DEFAULT_REGION } from "../regionConfig";
import { BRAND } from "../brandConfig";

export function getQuestions(region = DEFAULT_REGION) {
  const config = getRegionConfig(region);
  return [
    {
      key: "location",
      question: "Where are you looking to buy a property?",
      hint: config.locationHint,
    },
    {
      key: "budget",
      question: "What is your maximum budget?",
      hint: config.budgetHint,
    },
    {
      key: "bedrooms",
      question: "How many bedrooms do you need?",
      hint: "Enter a number between 1 and 10",
    },
  ];
}

export function getQuickOptions(region = DEFAULT_REGION) {
  const config = getRegionConfig(region);
  return {
    location: config.locations,
    budget: config.budgetOptions,
    bedrooms: ["1", "2", "3", "4"],
  };
}

export function formatOption(key, value, region = DEFAULT_REGION) {
  const config = getRegionConfig(region);
  if (key === "budget") return formatPrice(region, value);
  if (key === "bedrooms") {
    return region === "IN" ? `${value} BHK` : `${value} Bed`;
  }
  return value;
}

const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const INDIAN_SCALE_WORDS = {
  hundred: 100,
  thousand: 1000,
  k: 1000,
  lakh: 100000,
  lakhs: 100000,
  lac: 100000,
  lacs: 100000,
  crore: 10000000,
  crores: 10000000,
  cr: 10000000,
};

const US_SCALE_WORDS = {
  hundred: 100,
  thousand: 1000,
  thousands: 1000,
  k: 1000,
  million: 1000000,
  millions: 1000000,
  m: 1000000,
};

function parseWordNumber(text, scaleWords) {
  const words = text
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\band\b/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return NaN;

  let total = 0;
  let current = 0;
  let foundNumeric = false;

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      current += NUMBER_WORDS[word];
      foundNumeric = true;
    } else if (scaleWords[word] !== undefined) {
      const scale = scaleWords[word];
      if (scale >= 1000) {
        current = (current || 1) * scale;
        total += current;
        current = 0;
      } else {
        current = (current || 1) * scale;
      }
      foundNumeric = true;
    } else if (/^\d+(\.\d+)?$/.test(word)) {
      current += parseFloat(word);
      foundNumeric = true;
    }
  }

  if (!foundNumeric) return NaN;
  return total + current;
}

const HINDI_NUMS = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  ath: 8,
  nau: 9,
  das: 10,
  bees: 20,
  bis: 20,
  teis: 30,
  tees: 30,
  chalis: 40,
  chaalis: 40,
  pachaas: 50,
  pachas: 50,
  pacchas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  athh: 80,
  nabbe: 90,
  ek_sau: 100,
};

function parseHindiRomanBudget(text) {
  const match = text.match(
    /\b(ek|do|teen|char|paanch|panch|chhe|che|saat|aath|ath|nau|das|bees|bis|teis|tees|chalis|chaalis|pachaas|pachas|pacchas|saath|sattar|assi|athh|nabbe|\d+)\s*(lakh|lakhs|lac|lacs|crore|crores|cr)\b/i
  );
  if (!match) return NaN;

  let base = match[1].toLowerCase();
  if (HINDI_NUMS[base] !== undefined) base = HINDI_NUMS[base];
  else base = parseFloat(base);

  const scale = match[2].toLowerCase().startsWith("cr") ? 10000000 : 100000;
  if (!Number.isNaN(base)) return Math.round(base * scale);
  return NaN;
}

function parseIndianBudget(text) {
  const hindiAmount = parseHindiRomanBudget(text);
  if (!Number.isNaN(hindiAmount) && hindiAmount > 0) return hindiAmount;

  const multiplierMatch = text.match(
    /^([\d.]+)\s*(crore|crores|cr|lakh|lakhs|lac|lacs|thousand|thousands|k)\b/
  );
  if (multiplierMatch) {
    const base = parseFloat(multiplierMatch[1]);
    const mult = INDIAN_SCALE_WORDS[multiplierMatch[2]];
    if (!Number.isNaN(base) && mult) return Math.round(base * mult);
  }

  const fromWords = parseWordNumber(text, INDIAN_SCALE_WORDS);
  if (!Number.isNaN(fromWords) && fromWords > 0) return Math.round(fromWords);

  return NaN;
}

function parseUsBudget(text) {
  const multiplierMatch = text.match(
    /^([\d.]+)\s*(million|millions|m|thousand|thousands|k)\b/
  );
  if (multiplierMatch) {
    const base = parseFloat(multiplierMatch[1]);
    const mult = US_SCALE_WORDS[multiplierMatch[2]];
    if (!Number.isNaN(base) && mult) return Math.round(base * mult);
  }

  const fromWords = parseWordNumber(text, US_SCALE_WORDS);
  if (!Number.isNaN(fromWords) && fromWords > 0) return Math.round(fromWords);

  return NaN;
}

export function parseBudgetAmount(input, region = DEFAULT_REGION) {
  if (!input || !String(input).trim()) return NaN;

  let text = String(input).toLowerCase().trim();
  text = text
    .replace(/rupees?|rs\.?|inr|₹|dollars?|usd|\$/g, "")
    .replace(/,/g, "")
    .trim();

  const digitsOnly = text.replace(/[^\d]/g, "");
  const compactText = text.replace(/\s/g, "");
  if (digitsOnly && digitsOnly === compactText) {
    return parseInt(digitsOnly, 10);
  }

  const fromRegion = region === "US" ? parseUsBudget(text) : parseIndianBudget(text);
  if (!Number.isNaN(fromRegion) && fromRegion > 0) return fromRegion;

  if (digitsOnly) return parseInt(digitsOnly, 10);

  return NaN;
}

function parseBedroomCount(text) {
  const trimmed = text.trim().toLowerCase();
  const bhkMatch = trimmed.match(
    /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|paanch|panch)\s*(bhk|bed|bedroom|bedrooms)?$/
  );
  if (!bhkMatch) return NaN;

  let num = bhkMatch[1];
  if (NUMBER_WORDS[num] !== undefined) return NUMBER_WORDS[num];
  if (HINDI_NUMS[num] !== undefined) return HINDI_NUMS[num];
  return parseInt(num, 10);
}

export function parseNaturalQuery(text, region = DEFAULT_REGION) {
  if (!text?.trim()) return null;

  const config = getRegionConfig(region);
  const original = text.trim();
  let searchable = original.toLowerCase();
  const result = {};

  searchable = searchable.replace(
    /\b(mein|me|in|under|below|around|budget|ke|liye|for|at|with|a|an|the|property|ghar|flat|apartment|looking|want|need|search)\b/gi,
    " "
  );

  const bedPatterns = [
    /\b(\d+)\s*bhk\b/i,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|paanch|panch)\s*bhk\b/i,
    /\b(\d+)\s*(?:bed|bedroom|bedrooms)\b/i,
  ];

  for (const pattern of bedPatterns) {
    const match = original.match(pattern);
    if (!match) continue;
    let num = match[1].toLowerCase();
    if (NUMBER_WORDS[num] !== undefined) num = NUMBER_WORDS[num];
    else if (HINDI_NUMS[num] !== undefined) num = HINDI_NUMS[num];
    else num = parseInt(num, 10);
    if (num >= 1 && num <= 10) {
      result.bedrooms = String(num);
      searchable = searchable.replace(match[0].toLowerCase(), " ");
    }
    break;
  }

  const budgetPatterns = [
    /(\d+[\d,.]*\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr)\b)/gi,
    /((?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|paanch|panch|pachaas|pachas|pacchas|bees|bis)\s+(?:lakh|lakhs|lac|crore|crores|million|thousand)\b)/gi,
    /(\d+[\d,.]*\s*(?:million|millions|m|k|thousand)\b)/gi,
    /(\d{6,})/g,
  ];

  for (const pattern of budgetPatterns) {
    const matches = [...original.matchAll(pattern)];
    for (const match of matches) {
      const amount = parseBudgetAmount(match[1], region);
      if (!Number.isNaN(amount) && amount >= config.budgetMin * 0.4) {
        result.budget = String(amount);
        searchable = searchable.replace(match[1].toLowerCase(), " ");
        break;
      }
    }
    if (result.budget) break;
  }

  const haystack = `${searchable} ${original.toLowerCase()}`;
  for (const city of [...config.locations].sort((a, b) => b.length - a.length)) {
    const cityLower = city.toLowerCase();
    if (haystack.includes(cityLower)) {
      result.location = city;
      break;
    }
  }

  if (result.location && result.budget && result.bedrooms) return result;
  return null;
}

export function buildPropertySummary(property, region = DEFAULT_REGION) {
  const price = formatPrice(region, property.price);
  const bedLabel = region === "IN" ? "BHK" : "bed";
  const amenities = property.amenities?.slice(0, 3).join(", ") || "standard amenities";
  return `${property.title} in ${property.location} — ${price}, ${property.bedrooms} ${bedLabel}, ${property.bathrooms} bath, ${property.size_sqft} sq ft. Highlights: ${amenities}.`;
}

export function validateAnswer(key, value, region = DEFAULT_REGION) {
  const trimmed = value.trim();
  const config = getRegionConfig(region);

  if (!trimmed) {
    return { valid: false, error: "Please type an answer or tap one of the options below." };
  }

  if (key === "location") {
    if (/^\d+$/.test(trimmed)) {
      return {
        valid: false,
        error: `That looks like a number. Please enter a city name like ${config.locationExamples}.`,
      };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: "City name is too short. Please enter at least 2 letters." };
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      return {
        valid: false,
        error: `Please use letters for the location. Example: ${config.locationExamples}`,
      };
    }
    return { valid: true, value: trimmed };
  }

  if (key === "budget") {
    const num = parseBudgetAmount(trimmed, region);
    if (Number.isNaN(num)) {
      return {
        valid: false,
        error: `I couldn't understand that amount. Try ${config.budgetVoiceExamples}.`,
      };
    }
    if (num < config.budgetMin) {
      return {
        valid: false,
        error: `Minimum budget is ${formatPrice(region, config.budgetMin)}. Please enter a higher amount.`,
      };
    }
    if (num > config.budgetMax) {
      return {
        valid: false,
        error: `Please enter a budget below ${formatPrice(region, config.budgetMax)}.`,
      };
    }
    return { valid: true, value: String(num) };
  }

  if (key === "bedrooms") {
    const num = parseBedroomCount(trimmed);
    if (Number.isNaN(num) || num < 1 || num > 10) {
      return {
        valid: false,
        error: "Bedrooms must be between 1 and 10. Say do BHK, teen BHK, or tap an option.",
      };
    }
    return { valid: true, value: String(num) };
  }

  return { valid: true, value: trimmed };
}

export function parsePropertyApiResponse(data) {
  if (Array.isArray(data)) {
    return { properties: data, matchType: "exact" };
  }
  return {
    properties: Array.isArray(data?.properties) ? data.properties : [],
    matchType: data?.matchType || "exact",
  };
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function createWelcomeMessages(region = DEFAULT_REGION) {
  const config = getRegionConfig(region);
  const questions = getQuestions(region);
  const now = new Date();
  return [
    {
      type: "bot",
      text: `Hi! I'm ${BRAND.assistant} from ${BRAND.name}. I'll help you find the perfect property in ${config.flag} ${config.label}.`,
      time: now,
    },
    {
      type: "bot",
      text: questions[0].question,
      hint: `${questions[0].hint} ${config.oneShotHint || ""}`.trim(),
      time: now,
    },
  ];
}

// Backward-compatible exports for static imports
export const QUESTIONS = getQuestions(DEFAULT_REGION);
export const QUICK_OPTIONS = getQuickOptions(DEFAULT_REGION);
