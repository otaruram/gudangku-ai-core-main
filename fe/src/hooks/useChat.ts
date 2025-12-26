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
        content: "Halo! Saya Doc Assistant yang terhubung dengan database dokumen SOP Anda. Tanyakan apa saja tentang prosedur gudang, kebijakan retur, atau standar operasional lainnya.",
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
            content: input || (file ? `[Mengirim Dokumen: ${file.name}]` : ""),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const formData = new FormData();
            formData.append("question", input || "Tolong analisis dokumen ini.");
            if (file) {
                formData.append("file", file);
            }

            // Use production backend URL - mobile devices need absolute URL
            const API_URL = import.meta.env.VITE_API_URL || "https://gudangku-ai.onrender.com/api";

            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "Maaf, saya tidak dapat terhubung ke server.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Maaf, terjadi kesalahan saat menghubungi AI. Pastikan backend berjalan.",
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
