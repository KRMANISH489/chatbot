import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Chatbot from "./components/Chatbot";
import { DEFAULT_REGION } from "./regionConfig";

const STORAGE_KEY = "mira-region";

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [region, setRegion] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_REGION);
  const [chatKey, setChatKey] = useState(0);
  const [chatContext, setChatContext] = useState(null);
  const [comparePair, setComparePair] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, region);
  }, [region]);

  const handleRegionChange = (nextRegion) => {
    if (nextRegion === region) return;
    setRegion(nextRegion);
    setChatKey((k) => k + 1);
    setChatContext(null);
    setComparePair(null);
  };

  const openChat = (context = null) => {
    if (context) setChatContext(context);
    setChatOpen(true);
  };

  const handleCompareFromChat = (prop1, prop2) => {
    setComparePair({ prop1, prop2 });
    setChatOpen(false);
    setTimeout(() => {
      document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  return (
    <div className="App">
      <LandingPage
        region={region}
        onRegionChange={handleRegionChange}
        onOpenChat={() => openChat()}
        onAskAboutProperty={(property) => openChat({ type: "property", property })}
        comparePair={comparePair}
        onCompareConsumed={() => setComparePair(null)}
      />
      <Chatbot
        key={chatKey}
        region={region}
        onRegionChange={handleRegionChange}
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
        chatContext={chatContext}
        onChatContextConsumed={() => setChatContext(null)}
        onCompareProperties={handleCompareFromChat}
      />
    </div>
  );
}

export default App;
