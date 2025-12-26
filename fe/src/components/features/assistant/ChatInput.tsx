import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: (file?: File) => void;
    isTyping: boolean;
}

export function ChatInput({ input, setInput, handleSend, isTyping }: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSend = () => {
        handleSend(selectedFile || undefined);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="mt-3 rounded-xl border border-border bg-card p-2 sm:mt-4">
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2 rounded-md bg-secondary/50 p-2 text-xs">
                    <Paperclip className="h-3 w-3" />
                    <span className="flex-1 truncate font-medium">{selectedFile.name}</span>
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden shrink-0 sm:flex"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedFile ? "Tambahkan pesan untuk dokumen ini..." : "Tanyakan tentang dokumen SOP Anda..."}
                    rows={1}
                    className="flex-1 resize-none border-0 bg-transparent py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <Button
                    onClick={onSend}
                    disabled={(!input.trim() && !selectedFile) || isTyping}
                    variant="default"
                    size="icon"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="mt-1.5 hidden px-2 text-xs text-muted-foreground sm:block sm:mt-2">
                Tekan Enter untuk kirim • Shift + Enter untuk baris baru
            </p>
        </div>
    );
}
