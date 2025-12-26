import { AIStatus } from "@/components/features/assistant/AIStatus";
import { useEffect } from "react";
import { MessageList } from "@/components/features/assistant/MessageList";
import { ChatInput } from "@/components/features/assistant/ChatInput";
import { useChatContext } from "@/context/ChatContext";

export default function DocAssistant() {
  const { messages, input, setInput, isTyping, handleSend, messagesEndRef } = useChatContext();

  // Check for auto-prompt from Dashboard
  useEffect(() => {
    const prompt = localStorage.getItem('assistant_prompt');
    if (prompt) {
      localStorage.removeItem('assistant_prompt'); // Consume it
      setInput(prompt);
      // Optional: Auto-send after a short delay or just let user click send
      // handleSend() // If we want auto send
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-10rem)]">
      {/* Page Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Doc Assistant</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Tanya jawab dokumen SOP dengan AI lokal</p>
        </div>
        <button
          onClick={() => {
            if (confirm("Ganti Sesi Dokumen? Chat saat ini akan dibersihkan.")) {
              localStorage.removeItem('chatHistory');
              window.location.reload();
            }
          }}
          className="text-xs border px-2 py-1 rounded hover:bg-secondary"
        >
          Ganti Dokumen / Reset
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

