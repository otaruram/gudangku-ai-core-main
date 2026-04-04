import { AIStatus } from "@/components/features/assistant/AIStatus";
import { useEffect, useState } from "react";
import { MessageList } from "@/components/features/assistant/MessageList";
import { ChatInput } from "@/components/features/assistant/ChatInput";
import { useChatContext } from "@/context/ChatContext";
import { Database, Upload } from "lucide-react";

export default function DocAssistant() {
  const { messages, input, setInput, isTyping, handleSend, messagesEndRef } = useChatContext();
  const [csvLoaded, setCsvLoaded] = useState(false);
  const csvFileName = localStorage.getItem('csvFileName');

  useEffect(() => {
    setCsvLoaded(!!localStorage.getItem('csvContext'));
  }, []);

  // Check for auto-prompt from Dashboard
  useEffect(() => {
    const prompt = localStorage.getItem('assistant_prompt');
    if (prompt) {
      localStorage.removeItem('assistant_prompt');
      setInput(prompt);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-10rem)]">
      {/* Page Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Doc Assistant</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {csvLoaded
              ? "AI assistant with your warehouse data context"
              : "Upload a CSV in Forecaster to enable data-aware answers"}
          </p>
          {csvLoaded && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-500">
              <Database className="h-3 w-3" />
              CSV loaded: {csvFileName || 'data.csv'}
            </div>
          )}
          {!csvLoaded && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-yellow-600">
              <Upload className="h-3 w-3" />
              No CSV data — answers will be generic
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm("Switch Document Session? Current chat will be cleared.")) {
              localStorage.removeItem('chatHistory');
              window.location.reload();
            }
          }}
          className="text-xs border px-2 py-1 rounded hover:bg-secondary"
        >
          Change Document / Reset
        </button>
      </div>

      {/* Ollama Status Bar */}
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

