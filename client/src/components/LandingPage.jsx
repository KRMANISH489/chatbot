import React, { useState, useEffect } from "react";
import BrandLogo from "./BrandLogo";
import PropertyCompare from "./PropertyCompare";
import FeaturedProperties from "./FeaturedProperties";
import RegionSwitcher from "./RegionSwitcher";
import { BRAND } from "../brandConfig";
import { getRegionConfig } from "../regionConfig";
import "./LandingPage.scss";

function LandingPage({ region, onRegionChange, onOpenChat, onAskAboutProperty, comparePair, onCompareConsumed }) {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const regionConfig = getRegionConfig(region);

  return (
    <div className="landing-page">
      <nav className={`landing-nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="landing-container landing-nav__inner">
          <button type="button" className="nav-logo-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <BrandLogo size="sm" light={!navScrolled} />
          </button>
          <div className="landing-nav__links">
            <button type="button" onClick={() => scrollTo("features")}>Features</button>
            <button type="button" onClick={() => scrollTo("compare")}>Compare</button>
            <button type="button" onClick={() => scrollTo("properties")}>Properties</button>
          </div>
          <RegionSwitcher region={region} onRegionChange={onRegionChange} compact />
          <button type="button" className="nav-cta" onClick={onOpenChat}>
            Talk to {BRAND.assistant}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero__overlay" />
        <div className="landing-container hero__content">
          <div className="hero__badge">Trusted Real Estate Platform</div>
          <h1>
            Find Your Dream Home
            <span> With AI-Powered Guidance</span>
          </h1>
          <p>
            Search smart, compare instantly, and chat with {BRAND.name} — your personal
            property assistant with voice support.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn-primary" onClick={onOpenChat}>
              Start AI Chat
            </button>
            <button type="button" className="btn btn-outline" onClick={() => scrollTo("compare")}>
              Compare Properties
            </button>
          </div>
          <div className="hero-region">
            <span>Search properties in:</span>
            <RegionSwitcher region={region} onRegionChange={onRegionChange} />
          </div>
          <div className="hero__stats">
            <div><strong>500+</strong><span>Properties</span></div>
            <div><strong>50+</strong><span>Cities</span></div>
            <div><strong>24/7</strong><span>AI Support</span></div>
          </div>
        </div>
      </header>

      <section className="landing-section features-section" id="features">
        <div className="landing-container">
          <div className="section-intro section-intro--center">
            <span className="section-label">Why {BRAND.name}</span>
            <h2>Everything You Need In One Place</h2>
          </div>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-card__icon">💬</div>
              <h3>Smart AI Chatbot</h3>
              <p>Answer a few questions and get personalized property matches instantly.</p>
              <button type="button" className="feature-link" onClick={onOpenChat}>Open Chat →</button>
            </article>
            <article className="feature-card">
              <div className="feature-card__icon">⚖️</div>
              <h3>Side-by-Side Compare</h3>
              <p>Enter location, price, or BHK for two properties and compare in one view.</p>
              <button type="button" className="feature-link" onClick={() => scrollTo("compare")}>Compare Now →</button>
            </article>
            <article className="feature-card">
              <div className="feature-card__icon">🎤</div>
              <h3>Voice Assistant</h3>
              <p>Speak naturally — {BRAND.assistant} listens and responds with voice-enabled support.</p>
              <button type="button" className="feature-link" onClick={onOpenChat}>Try Voice →</button>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section compare-section-wrap" id="compare">
        <div className="landing-container">
          <div className="section-intro section-intro--center">
            <span className="section-label">Property Compare</span>
            <h2>Compare Two Properties Instantly</h2>
            <p>One input per property — type location, price, or bedrooms in {regionConfig.label}.</p>
          </div>
          <PropertyCompare
            region={region}
            comparePair={comparePair}
            onCompareConsumed={onCompareConsumed}
          />
        </div>
      </section>

      <FeaturedProperties region={region} onAskAboutProperty={onAskAboutProperty} />

      <section className="cta-banner">
        <div className="landing-container cta-banner__inner">
          <BrandLogo size="lg" showTagline light />
          <h2>Ready to find your next home?</h2>
          <p>Chat with {BRAND.assistant} and discover properties tailored to your budget and lifestyle.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={onOpenChat}>
            Chat With {BRAND.assistant}
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <BrandLogo size="sm" showTagline />
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="footer-links">
            <button type="button" onClick={() => scrollTo("features")}>Features</button>
            <button type="button" onClick={() => scrollTo("compare")}>Compare</button>
            <button type="button" onClick={onOpenChat}>Chat</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
