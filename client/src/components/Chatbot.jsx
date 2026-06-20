import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  QUESTIONS,
  QUICK_OPTIONS,
  validateAnswer,
  formatOption,
  formatTime,
  createWelcomeMessages,
} from "./chatHelpers";
import "./ChatBot.scss";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const API_URL = "http://localhost:5000/api/properties";
const FALLBACK_IMAGE = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg";

function stripForSpeech(text) {
  return text.replace(/[^\w\s,.₹$%-]/g, " ").replace(/\s+/g, " ").trim();
}

function Chatbot({ isOpen: controlledOpen, onOpenChange }) {
  const [messages, setMessages] = useState(createWelcomeMessages);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatComplete, setChatComplete] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [retryField, setRetryField] = useState(null);
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
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

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
        speak(`${p.title}, price ${p.price} rupees, ${p.location}, ${p.bedrooms} bedrooms`);
      }
    }
  }, [messages, isOpen, voiceEnabled, speak]);

  useEffect(() => {
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      voiceSubmitPendingRef.current = true;
      setInput(event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

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
    setMessages(createWelcomeMessages());
    setInput("");
    setStep(0);
    setFormData({});
    setLoading(false);
    setIsTyping(false);
    setChatComplete(false);
    setSearchFailed(false);
    setRetryField(null);
  };

  const editField = async (fieldKey) => {
    const stepIndex = QUESTIONS.findIndex((q) => q.key === fieldKey);
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

    const question = QUESTIONS[stepIndex];
    await pushBotMessage(`Let's update your ${fieldKey}. ${question.question}`, {
      hint: question.hint,
    });
  };

  const searchProperties = async (criteria) => {
    setLoading(true);
    setSearchFailed(false);
    await pushBotMessage("Searching for matching properties...", {}, 500);

    try {
      const res = await axios.post(API_URL, criteria, { timeout: 10000 });
      const results = Array.isArray(res.data) ? res.data : [];

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
        await pushBotMessage(`Great news! I found ${results.length} matching ${results.length === 1 ? "property" : "properties"} for you:`);
        setMessages((prev) => [
          ...prev,
          ...results.map((prop) => ({ type: "property", data: prop, time: new Date() })),
        ]);
        await pushBotMessage("Need another search? Tap 'Search Again' below.", { showActions: true }, 400);
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

  const handleSubmit = async (textOverride) => {
    const answer = (textOverride ?? input).trim();
    if (!answer || loading || isTyping || chatComplete) return;

    const currentQuestion = QUESTIONS[step];
    const validation = validateAnswer(currentQuestion.key, answer);

    setMessages((prev) => [...prev, { type: "user", text: answer, time: new Date() }]);
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

    if (step + 1 < QUESTIONS.length) {
      const nextStep = step + 1;
      const nextQuestion = QUESTIONS[nextStep];
      setStep(nextStep);
      await pushBotMessage(nextQuestion.question, { hint: nextQuestion.hint });
    } else {
      setStep(QUESTIONS.length);
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

  const currentKey = step < QUESTIONS.length ? QUESTIONS[step].key : null;
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
              <div className="bot-avatar">M</div>
              <div>
                <strong>Agent Mira</strong>
                <span className="online-status">Online • Property Assistant</span>
              </div>
            </div>
            <div className="chat-header-actions">
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
                {msg.type !== "user" && <div className="bot-avatar small">M</div>}

                {msg.type === "property" ? (
                  <div className="property-card">
                    <img
                      src={msg.data.image_url}
                      alt={msg.data.title}
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <h4>{msg.data.title}</h4>
                    <p className="property-price">
                      ₹{Number(msg.data.price).toLocaleString("en-IN")}
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
                <div className="bot-avatar small">M</div>
                <div className="bubble bot typing-bubble">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}

            {isListening && (
              <div className="msg-row bot">
                <div className="bot-avatar small">M</div>
                <div className="bubble bot listening">Listening... speak now</div>
              </div>
            )}

            <div ref={chatRef} />
          </div>

          {(showQuickOptions || showInvalidOptions || showRetryOptions || chatComplete) && (
            <div className={`quick-replies ${showInvalidOptions || showRetryOptions ? "retry-mode" : ""}`}>
              {showInvalidOptions && (
                <p className="quick-replies-label">
                  Select {retryField} again:
                </p>
              )}

              {(showQuickOptions || showInvalidOptions) &&
                currentKey &&
                QUICK_OPTIONS[currentKey].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="quick-reply-btn"
                    onClick={() => handleSubmit(option)}
                  >
                    {formatOption(currentKey, option)}
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
                <button type="button" className="quick-reply-btn primary" onClick={restartChat}>
                  Search Again
                </button>
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
                      ? "Speak now..."
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
