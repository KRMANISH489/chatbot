export const QUESTIONS = [
  {
    key: "location",
    question: "Where are you looking to buy a property?",
    hint: "Choose a city or type your own (e.g. New York, Miami)",
  },
  {
    key: "budget",
    question: "What is your maximum budget?",
    hint: "Enter amount in rupees (e.g. 500000)",
  },
  {
    key: "bedrooms",
    question: "How many bedrooms do you need?",
    hint: "Enter a number between 1 and 10",
  },
];

export const QUICK_OPTIONS = {
  location: ["New York", "Miami", "Austin", "Dallas", "Chicago"],
  budget: ["250000", "500000", "750000", "1000000"],
  bedrooms: ["1", "2", "3", "4"],
};

export function formatOption(key, value) {
  if (key === "budget") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (key === "bedrooms") return `${value} BHK`;
  return value;
}

export function validateAnswer(key, value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Please type an answer or tap one of the options below." };
  }

  if (key === "location") {
    if (/^\d+$/.test(trimmed)) {
      return {
        valid: false,
        error: "That looks like a number. Please enter a city name like New York or Miami.",
      };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: "City name is too short. Please enter at least 2 letters." };
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      return { valid: false, error: "Please use letters for the location. Example: Austin, Boston" };
    }
    return { valid: true, value: trimmed };
  }

  if (key === "budget") {
    const num = parseInt(trimmed.replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(num)) {
      return { valid: false, error: "Budget must be a number. Example: 500000" };
    }
    if (num < 100000) {
      return { valid: false, error: "Minimum budget is ₹1,00,000. Please enter a higher amount." };
    }
    if (num > 50000000) {
      return { valid: false, error: "Please enter a budget below ₹5,00,00,000." };
    }
    return { valid: true, value: String(num) };
  }

  if (key === "bedrooms") {
    const num = parseInt(trimmed.replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(num) || num < 1 || num > 10) {
      return {
        valid: false,
        error: "Bedrooms must be between 1 and 10. Tap an option or type a number.",
      };
    }
    return { valid: true, value: String(num) };
  }

  return { valid: true, value: trimmed };
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function createWelcomeMessages() {
  const now = new Date();
  return [
    {
      type: "bot",
      text: "Hi! I'm Mira, your real estate assistant. I'll help you find the perfect property.",
      time: now,
    },
    {
      type: "bot",
      text: QUESTIONS[0].question,
      hint: QUESTIONS[0].hint,
      time: now,
    },
  ];
}
