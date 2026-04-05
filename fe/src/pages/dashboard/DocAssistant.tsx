import { AIStatus } from "@/components/features/assistant/AIStatus";
import { useEffect, useState } from "react";
import { MessageList } from "@/components/features/assistant/MessageList";
import { ChatInput } from "@/components/features/assistant/ChatInput";
import { useChatContext } from "@/context/ChatContext";
import { Database, Upload } from "lucide-react";
import { getSessionData, removeSessionData } from "@/lib/sessionData";

export default function DocAssistant() {
  const { messages, input, setInput, isTyping, handleSend, messagesEndRef } = useChatContext();
  const [csvLoaded, setCsvLoaded] = useState(false);
  const csvFileName = getSessionData('csvFileName');

  useEffect(() => {
    setCsvLoaded(!!getSessionData('csvContext'));
  }, []);

  // Check for auto-prompt from Dashboard
  useEffect(() => {
    const prompt = getSessionData('assistant_prompt');
    if (prompt) {
      removeSessionData('assistant_prompt');
      setInput(prompt);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[620px] flex-col sm:h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div
        className="mb-3 sm:mb-4 flex items-center justify-between rounded-xl border px-4 py-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text-primary)" }}>Doc Assistant</h1>
          <p className="text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            {csvLoaded
              ? "AI assistant with your warehouse data context"
              : "Upload a CSV first to enable data-aware answers"}
          </p>
          {csvLoaded && (
            <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-safe)" }}>
              <Database className="h-3 w-3" />
              CSV loaded: {csvFileName || 'data.csv'}
            </div>
          )}
          {!csvLoaded && (
            <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-warning)" }}>
              <Upload className="h-3 w-3" />
              No CSV data — answers will be generic
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm("Switch Document Session? Current chat will be cleared.")) {
              removeSessionData('chatHistory');
              window.location.reload();
            }
          }}
          className="text-xs border px-2 py-1 rounded transition-colors"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-secondary)" }}
        >
          Change Document / Reset
        </button>
      </div>

      {/* AI Status Bar */}
      <AIStatus />

      {/* Chat Container */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area */}
      {/* Note: ChatInput uses "default" variant for button now, checking if valid */}
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isTyping={isTyping}
      />
    </div>
  );
}

