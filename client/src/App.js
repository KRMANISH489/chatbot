import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Chatbot from "./components/Chatbot";

function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="App">
      <LandingPage onOpenChat={() => setChatOpen(true)} />
      <Chatbot isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}

export default App;
