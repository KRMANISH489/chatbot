export const VOICE_LANG_STORAGE_KEY = "mira-voice-lang";

export const VOICE_LANGS = {
  en: { id: "en", label: "EN", speechLang: "en-IN", title: "English voice" },
  hi: { id: "hi", label: "हिं", speechLang: "hi-IN", title: "Hindi / Hinglish voice" },
};

const DEVANAGARI_CITIES = {
  मुंबई: "Mumbai",
  मुम्बई: "Mumbai",
  दिल्ली: "Delhi",
  बैंगलोर: "Bangalore",
  बेंगलुरु: "Bangalore",
  पुणे: "Pune",
  पुणे: "Pune",
  हैदराबाद: "Hyderabad",
  हाइदराबाद: "Hyderabad",
};

const DEVANAGARI_NUMS = {
  एक: "1",
  दो: "2",
  तीन: "3",
  चार: "4",
  पांच: "5",
  पाँच: "5",
  छह: "6",
  सात: "7",
  आठ: "8",
  नौ: "9",
  दस: "10",
  बीस: "20",
  तीस: "30",
  चालीस: "40",
  पचास: "50",
  साठ: "60",
  सत्तर: "70",
  अस्सी: "80",
  नब्बे: "90",
};

export function getSpeechLang(region, voiceLang = "en") {
  if (region === "US") return "en-US";
  return VOICE_LANGS[voiceLang]?.speechLang || VOICE_LANGS.en.speechLang;
}

export function normalizeVoiceInput(text, region, voiceLang = "en") {
  if (!text?.trim() || region !== "IN" || voiceLang !== "hi") {
    return text?.trim() || "";
  }

  let normalized = text.trim();

  Object.entries(DEVANAGARI_CITIES).forEach(([hindi, latin]) => {
    normalized = normalized.replace(new RegExp(hindi, "g"), latin);
  });

  Object.entries(DEVANAGARI_NUMS).forEach(([hindi, num]) => {
    normalized = normalized.replace(new RegExp(hindi, "g"), num);
  });

  normalized = normalized
    .replace(/लाख/gi, " lakh ")
    .replace(/करोड़/gi, " crore ")
    .replace(/करोड/gi, " crore ")
    .replace(/रुपये|रुपए|रुपया/gi, " rupees ")
    .replace(/बीएचके|बीएचके/gi, " BHK ")
    .replace(/में|मे|मैं/gi, " mein ")
    .replace(/घर|फ्लैट|फ्लाट/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

export function isHindiVoiceAvailable(region) {
  return region === "IN";
}
