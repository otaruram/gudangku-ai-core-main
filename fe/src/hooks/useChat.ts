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
            const { API_URL, getAuthHeaders } = await import("@/lib/config");
            const authHeaders = await getAuthHeaders();

            // Include CSV context if available
            const csvContext = localStorage.getItem('csvContext') || '';
            const questionWithContext = csvContext
                ? `[CSV DATA CONTEXT]\n${csvContext}\n\n[USER QUESTION]\n${input || "Please analyze this document."}`
                : (input || "Please analyze this document.");

            let fetchOptions: RequestInit;
            if (file) {
                const formData = new FormData();
                formData.append("question", questionWithContext);
                formData.append("file", file);
                fetchOptions = {
                    method: "POST",
                    headers: { ...authHeaders },
                    body: formData,
                };
            } else {
                fetchOptions = {
                    method: "POST",
                    headers: { ...authHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({ question: questionWithContext }),
                };
            }

            const response = await fetch(`${API_URL}/chat`, fetchOptions);

            if (!response.ok) {
                let errMsg = `Error ${response.status}`;
                try {
                    const errBody = await response.json();
                    errMsg = errBody.error || errBody.detail || errMsg;
                } catch { /* ignore parse error */ }
                throw new Error(errMsg);
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "Sorry, unable to connect to the server.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Sorry, an error occurred: ${error.message || "Unknown error"}. Please try again.`,
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
