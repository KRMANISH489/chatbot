import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import {
  getQuestions,
  getQuickOptions,
  validateAnswer,
  formatOption,
  formatTime,
  createWelcomeMessages,
  parsePropertyApiResponse,
  parseNaturalQuery,
  buildPropertySummary,
} from "./chatHelpers";
import { BRAND } from "../brandConfig";
import { formatPrice, getRegionConfig, DEFAULT_REGION } from "../regionConfig";
import {
  getSpeechLang,
  normalizeVoiceInput,
} from "../voiceHelpers";
import { PROPERTIES_API_URL, LEADS_API_URL } from "../apiConfig";
import RegionSwitcher from "./RegionSwitcher";
import "./ChatBot.scss";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const FALLBACK_IMAGE = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg";

function stripForSpeech(text) {
  return text.replace(/[^\w\s,.₹$%-]/g, " ").replace(/\s+/g, " ").trim();
}

function Chatbot({
  region = DEFAULT_REGION,
  onRegionChange,
  isOpen: controlledOpen,
  onOpenChange,
  chatContext,
  onChatContextConsumed,
  onCompareProperties,
}) {
  const regionConfig = useMemo(() => getRegionConfig(region), [region]);
  const questions = useMemo(() => getQuestions(region), [region]);
  const quickOptions = useMemo(() => getQuickOptions(region), [region]);
  const voiceLang = region === "IN" ? "hi" : "en";
  const activeSpeechLang = useMemo(() => getSpeechLang(region, voiceLang), [region, voiceLang]);
  const hindiVoiceOn = region === "IN";

  const [messages, setMessages] = useState(() => createWelcomeMessages(region));
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatComplete, setChatComplete] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [retryField, setRetryField] = useState(null);
  const [lastResults, setLastResults] = useState([]);
  const [lastSearchCriteria, setLastSearchCriteria] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (value) => {
    const next = typeof value === "function" ? value(isOpen) : value;
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSpokenRef = useRef(-1);
  const voiceSubmitPendingRef = useRef(false);
  const contextHandledRef = useRef(null);

  useEffect(() => {
    setVoiceSupported(Boolean(SpeechRecognition && window.speechSynthesis));
  }, []);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, loading]);

  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    const cleanText = stripForSpeech(text);
    if (!cleanText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = activeSpeechLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, activeSpeechLang]);

  useEffect(() => {
    if (!isOpen || !voiceEnabled) return;
    const lastIndex = messages.length - 1;
    const lastMsg = messages[lastIndex];
    if (
      lastIndex !== lastSpokenRef.current &&
      lastMsg &&
      (lastMsg.type === "bot" || lastMsg.type === "property")
    ) {
      lastSpokenRef.current = lastIndex;
      if (lastMsg.type === "bot") speak(lastMsg.text);
      else if (lastMsg.type === "property") {
        const p = lastMsg.data;
        const priceLabel = formatPrice(region, p.price);
        speak(`${p.title}, price ${priceLabel}, ${p.location}, ${p.bedrooms} bedrooms`);
      }
    }
  }, [messages, isOpen, voiceEnabled, speak, region]);

  useEffect(() => {
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.lang = activeSpeechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      voiceSubmitPendingRef.current = true;
      const transcript = event.results[0][0].transcript;
      setInput(normalizeVoiceInput(transcript, region, voiceLang));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      window.speechSynthesis?.cancel();
    };
  }, [activeSpeechLang, region, voiceLang]);

  useEffect(() => {
    if (!isOpen || !chatContext || contextHandledRef.current === chatContext) return;
    contextHandledRef.current = chatContext;

    if (chatContext.type === "property" && chatContext.property) {
      const property = chatContext.property;
      const now = new Date();
      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          text: `Is property ke baare mein batao — ${property.title}`,
          time: now,
        },
        {
          type: "bot",
          text: "Sure! Here are the full details for this property:",
          time: now,
        },
        { type: "property", data: property, time: now },
        {
          type: "bot",
          text: buildPropertySummary(property, region),
          time: now,
        },
      ]);
      setChatComplete(false);
      setSearchFailed(false);
      setShowLeadForm(false);
    }

    onChatContextConsumed?.();
  }, [isOpen, chatContext, onChatContextConsumed, region]);

  const pushBotMessage = useCallback((text, extra = {}, delay = 700) => {
    setIsTyping(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { type: "bot", text, time: new Date(), ...extra },
        ]);
        resolve();
      }, delay);
    });
  }, []);

  const restartChat = () => {
    window.speechSynthesis?.cancel();
    lastSpokenRef.current = -1;
    setMessages(createWelcomeMessages(region));
    setInput("");
    setStep(0);
    setFormData({});
    setLoading(false);
    setIsTyping(false);
    setChatComplete(false);
    setSearchFailed(false);
    setRetryField(null);
    setLastResults([]);
    setLastSearchCriteria(null);
    setShowLeadForm(false);
    setLeadSubmitted(false);
    setLeadForm({ name: "", phone: "", email: "" });
    contextHandledRef.current = null;
  };

  const editField = async (fieldKey) => {
    const stepIndex = questions.findIndex((q) => q.key === fieldKey);
    if (stepIndex === -1) return;

    setSearchFailed(false);
    setChatComplete(false);
    setRetryField(fieldKey);
    setInput("");
    setStep(stepIndex);

    if (fieldKey === "location") {
      setFormData({});
    } else if (fieldKey === "budget") {
      setFormData((prev) => ({ location: prev.location }));
    }

    const question = questions[stepIndex];
    await pushBotMessage(`Let's update your ${fieldKey}. ${question.question}`, {
      hint: question.hint,
    });
  };

  const searchProperties = async (criteria) => {
    setLoading(true);
    setSearchFailed(false);
    await pushBotMessage("Searching for matching properties...", {}, 500);

    try {
      const res = await axios.post(PROPERTIES_API_URL, { ...criteria, region }, { timeout: 10000 });
      const { properties: results, matchType } = parsePropertyApiResponse(res.data);

      if (results.length === 0) {
        setChatComplete(false);
        setSearchFailed(true);
        setRetryField(null);
        await pushBotMessage(
          "Sorry, no properties match your criteria. Please change your budget or bedrooms and try again.",
          { showRetryActions: true }
        );
      } else {
        setChatComplete(true);
        setSearchFailed(false);
        setRetryField(null);
        setLastResults(results);
        setLastSearchCriteria(criteria);
        setShowLeadForm(true);
        setLeadSubmitted(false);
        if (matchType === "similar_range") {
          await pushBotMessage(
            "I couldn't find an exact match for your budget, but here are similar properties in your price range:"
          );
        } else {
          await pushBotMessage(
            `Great news! I found ${results.length} matching ${results.length === 1 ? "property" : "properties"} for you:`
          );
        }
        setMessages((prev) => [
          ...prev,
          ...results.map((prop) => ({ type: "property", data: prop, time: new Date() })),
        ]);
        await pushBotMessage("Need another search? Tap 'Search Again' below.", { showActions: true }, 400);
        await pushBotMessage(
          "Share your contact details below and an agent will call you back.",
          { showLeadPrompt: true },
          400
        );
      }
    } catch {
      setChatComplete(false);
      setSearchFailed(true);
      await pushBotMessage(
        "Something went wrong while fetching properties. Please check your connection and try again.",
        { showRetryActions: true }
      );
    } finally {
      setLoading(false);
    }
  };

  const runOneShotSearch = async (parsed, displayAnswer) => {
    setMessages((prev) => [...prev, { type: "user", text: displayAnswer, time: new Date() }]);
    setInput("");
    setStep(questions.length);

    const criteria = {
      location: parsed.location,
      budget: parsed.budget,
      bedrooms: parsed.bedrooms,
    };
    setFormData(criteria);
    await searchProperties(criteria);
  };

  const handleSubmit = async (textOverride) => {
    const rawAnswer = (textOverride ?? input).trim();
    const answer = normalizeVoiceInput(rawAnswer, region, voiceLang);
    if (!answer || loading || isTyping || chatComplete) return;

    if (step === 0) {
      const parsed = parseNaturalQuery(answer, region);
      if (parsed) {
        const locVal = validateAnswer("location", parsed.location, region);
        const budgetVal = validateAnswer("budget", parsed.budget, region);
        const bedVal = validateAnswer("bedrooms", parsed.bedrooms, region);

        if (locVal.valid && budgetVal.valid && bedVal.valid) {
          const displayAnswer = `${parsed.location} • ${formatOption("budget", budgetVal.value, region)} • ${formatOption("bedrooms", bedVal.value, region)}`;
          await runOneShotSearch(
            {
              location: locVal.value,
              budget: budgetVal.value,
              bedrooms: bedVal.value,
            },
            displayAnswer
          );
          return;
        }
      }
    }

    const currentQuestion = questions[step];
    const validation = validateAnswer(currentQuestion.key, answer, region);
    const displayText = validation.valid
      ? formatOption(currentQuestion.key, validation.value, region)
      : answer;

    setMessages((prev) => [...prev, { type: "user", text: displayText, time: new Date() }]);
    setInput("");

    if (!validation.valid) {
      setRetryField(currentQuestion.key);
      await pushBotMessage(validation.error);
      await pushBotMessage(`Please select your ${currentQuestion.key} again from the options below.`, {}, 400);
      return;
    }

    setRetryField(null);
    const updatedForm = { ...formData, [currentQuestion.key]: validation.value };
    setFormData(updatedForm);

    if (step + 1 < questions.length) {
      const nextStep = step + 1;
      const nextQuestion = questions[nextStep];
      setStep(nextStep);
      await pushBotMessage(nextQuestion.question, { hint: nextQuestion.hint });
    } else {
      setStep(questions.length);
      await searchProperties(updatedForm);
    }
  };

  useEffect(() => {
    if (!voiceSubmitPendingRef.current || isListening || !input.trim() || loading || isTyping) {
      return undefined;
    }
    voiceSubmitPendingRef.current = false;
    const timer = setTimeout(() => handleSubmit(input), 400);
    return () => clearTimeout(timer);
  }, [input, isListening, loading, isTyping]);

  const toggleListening = () => {
    if (!SpeechRecognition || loading || isTyping || chatComplete || searchFailed) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    setInput("");
    setIsListening(true);
    window.speechSynthesis?.cancel();
    recognitionRef.current?.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const submitLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim() || leadLoading) return;

    setLeadLoading(true);
    try {
      await axios.post(LEADS_API_URL, {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        region,
        searchCriteria: lastSearchCriteria,
      });
      setLeadSubmitted(true);
      setShowLeadForm(false);
      await pushBotMessage(
        `Thank you, ${leadForm.name.trim()}! An agent will call you at ${leadForm.phone.trim()} shortly.`,
        {},
        300
      );
    } catch {
      await pushBotMessage("Could not save your details. Please try again.", {}, 300);
    } finally {
      setLeadLoading(false);
    }
  };

  const currentKey = step < questions.length ? questions[step].key : null;
  const showQuickOptions =
    isOpen && !loading && !isTyping && !chatComplete && !searchFailed && currentKey;
  const showRetryOptions = isOpen && !loading && !isTyping && searchFailed;
  const showInvalidOptions =
    isOpen && !loading && !isTyping && !chatComplete && retryField && currentKey === retryField;

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="whatsapp-chatbot">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="bot-avatar">{BRAND.avatarLetter}</div>
              <div>
                <strong>{BRAND.name}</strong>
                <span className="online-status">Online • {regionConfig.flag} {regionConfig.label}</span>
              </div>
            </div>
            <div className="chat-header-actions">
              {onRegionChange && (
                <RegionSwitcher
                  region={region}
                  onRegionChange={onRegionChange}
                  compact
                />
              )}
              <button type="button" className="header-icon-btn" onClick={restartChat} title="Restart chat">
                ↺
              </button>
              {voiceSupported && (
                <button
                  type="button"
                  className={`voice-toggle-btn ${voiceEnabled ? "active" : ""}`}
                  onClick={() => {
                    setVoiceEnabled((prev) => !prev);
                    window.speechSynthesis?.cancel();
                  }}
                  aria-label={voiceEnabled ? "Mute voice" : "Enable voice"}
                >
                  {voiceEnabled ? "🔊" : "🔇"}
                </button>
              )}
              <button type="button" className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          <div className="chat-window">
            {messages.map((msg, idx) => (
              <div className={`msg-row ${msg.type === "user" ? "user" : "bot"}`} key={idx}>
                {msg.type !== "user" && <div className="bot-avatar small">{BRAND.avatarLetter}</div>}

                {msg.type === "property" ? (
                  <div className="property-card">
                    <img
                      src={msg.data.image_url}
                      alt={msg.data.title}
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <h4>{msg.data.title}</h4>
                    <p className="property-price">
                      {formatPrice(region, msg.data.price)}
                    </p>
                    <p>{msg.data.location}</p>
                    <div className="property-tags">
                      <span>{msg.data.bedrooms} Beds</span>
                      <span>{msg.data.bathrooms} Baths</span>
                      <span>{msg.data.size_sqft} sq ft</span>
                    </div>
                    <p className="property-amenities">{msg.data.amenities?.join(" • ")}</p>
                  </div>
                ) : (
                  <div className={`bubble ${msg.type}`}>
                    <p>{msg.text}</p>
                    {msg.hint && <span className="bubble-hint">{msg.hint}</span>}
                    {msg.time && <span className="msg-time">{formatTime(msg.time)}</span>}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="msg-row bot">
                <div className="bot-avatar small">{BRAND.avatarLetter}</div>
                <div className="bubble bot typing-bubble">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}

            {isListening && (
              <div className="msg-row bot">
                <div className="bot-avatar small">{BRAND.avatarLetter}</div>
                <div className="bubble bot listening">
                  {hindiVoiceOn ? "सुन रही हूँ... अब बोलिए" : "Listening... speak now"}
                </div>
              </div>
            )}

            <div ref={chatRef} />
          </div>

          {showLeadForm && !leadSubmitted && chatComplete && (
            <form className="lead-capture" onSubmit={submitLead}>
              <p className="lead-capture__title">📞 Agent callback</p>
              <input
                type="text"
                placeholder="Your name *"
                value={leadForm.name}
                onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="tel"
                placeholder="Phone number *"
                value={leadForm.phone}
                onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={leadForm.email}
                onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
              />
              <button type="submit" className="lead-capture__btn" disabled={leadLoading}>
                {leadLoading ? "Saving..." : "Request Callback"}
              </button>
            </form>
          )}

          {(showQuickOptions || showInvalidOptions || showRetryOptions || chatComplete) && (
            <div className={`quick-replies ${showInvalidOptions || showRetryOptions ? "retry-mode" : ""}`}>
              {showInvalidOptions && (
                <p className="quick-replies-label">
                  Select {retryField} again:
                </p>
              )}

              {(showQuickOptions || showInvalidOptions) &&
                currentKey &&
                quickOptions[currentKey].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="quick-reply-btn"
                    onClick={() => handleSubmit(option)}
                  >
                    {formatOption(currentKey, option, region)}
                  </button>
                ))}

              {showRetryOptions && (
                <>
                  <p className="quick-replies-label">What do you want to change?</p>
                  <button type="button" className="quick-reply-btn" onClick={() => editField("budget")}>
                    Change Budget
                  </button>
                  <button type="button" className="quick-reply-btn" onClick={() => editField("bedrooms")}>
                    Change Bedrooms
                  </button>
                  <button type="button" className="quick-reply-btn" onClick={() => editField("location")}>
                    Change Location
                  </button>
                  <button type="button" className="quick-reply-btn primary" onClick={restartChat}>
                    Start Over
                  </button>
                </>
              )}

              {chatComplete && !searchFailed && (
                <>
                  {lastResults.length >= 2 && onCompareProperties && (
                    <button
                      type="button"
                      className="quick-reply-btn"
                      onClick={() => onCompareProperties(lastResults[0], lastResults[1])}
                    >
                      ⚖️ Compare These
                    </button>
                  )}
                  <button type="button" className="quick-reply-btn primary" onClick={restartChat}>
                    Search Again
                  </button>
                </>
              )}
            </div>
          )}

          <div className="chat-input">
            {voiceSupported && (
              <button
                type="button"
                className={`mic-btn ${isListening ? "listening" : ""}`}
                onClick={toggleListening}
                disabled={loading || isTyping || chatComplete}
                aria-label="Voice input"
              >
                🎤
              </button>
            )}
            <input
              type="text"
              placeholder={
                chatComplete
                  ? "Search complete — tap Search Again"
                  : searchFailed
                    ? "Tap a button above to change your search"
                    : isListening
                      ? hindiVoiceOn
                        ? "Hindi mein boliye..."
                        : "Speak now..."
                      : step === 0
                        ? hindiVoiceOn
                          ? "Try: Mumbai mein pachaas lakh mein do BHK"
                          : "Try: Mumbai mein 50 lakh mein 2 BHK"
                        : hindiVoiceOn
                          ? "Type or speak in Hindi..."
                          : "Type a message..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || isTyping || isListening || chatComplete || searchFailed}
            />
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={
                loading ||
                isTyping ||
                isListening ||
                chatComplete ||
                searchFailed ||
                !input.trim()
              }
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`chat-toggle-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default Chatbot;
