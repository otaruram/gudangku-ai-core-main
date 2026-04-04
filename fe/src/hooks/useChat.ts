import { useState, useRef, useEffect } from "react";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const sampleMessages: Message[] = [
    {
        id: "1",
        role: "assistant",
        content: "Hello! I'm Doc Assistant connected to your SOP document database. Ask me anything about warehouse procedures, return policies, or other operational standards.",
        timestamp: new Date(),
    },
];

export function useChat() {
    const [messages, setMessages] = useState<Message[]>(sampleMessages);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
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

            // Use production backend URL - mobile devices need absolute URL
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
                content: "Sorry, an error occurred while contacting the AI. Make sure the backend is running.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return {
        messages,
        input,
        setInput,
        isTyping,
        handleSend,
        messagesEndRef
    };
}
