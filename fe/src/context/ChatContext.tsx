import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatContextType {
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    isTyping: boolean;
    handleSend: (file?: File) => Promise<void>;
    clearHistory: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};

const SAMPLE_WELCOME: Message = {
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm Doc Assistant, connected to your SOP document database and Warehouse Forecast data.",
    timestamp: new Date(),
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    // 1. Initialize from LocalStorage
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            try {
                // Revive dates
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        return [SAMPLE_WELCOME];
    });

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // 2. Sync to LocalStorage
    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);

    const handleSend = async (file?: File) => {
        if (!input.trim() && !file) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input || (file ? `[Sending Document: ${file.name}]` : ""),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const formData = new FormData();
            formData.append("question", input || "Please analyze this document.");
            if (file) {
                formData.append("file", file);
            }

            const { API_URL, getAuthHeaders } = await import("@/lib/config");
            const authHeaders = await getAuthHeaders();

            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { ...authHeaders },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "Sorry, unable to connect to the server.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, a technical error occurred. Make sure the backend is running.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        setMessages([SAMPLE_WELCOME]);
        localStorage.removeItem('chatHistory');
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <ChatContext.Provider value={{ messages, input, setInput, isTyping, handleSend, clearHistory, messagesEndRef }}>
            {children}
        </ChatContext.Provider>
    );
};
