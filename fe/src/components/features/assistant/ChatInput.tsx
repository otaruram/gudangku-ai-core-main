import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: (file?: File) => void;
    isTyping: boolean;
}

export function ChatInput({ input, setInput, handleSend, isTyping }: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const onSend = () => {
        handleSend();
    };

    return (
        <div className="mt-3 rounded-xl border border-border bg-card p-2 sm:mt-4">
            <div className="flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your inventory, supply chain, or warehouse data..."
                    rows={3}
                    className="flex-1 resize-none border-0 bg-transparent py-2 text-sm placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
                />
                <Button
                    onClick={onSend}
                    disabled={!input.trim() || isTyping}
                    variant="default"
                    size="icon"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="mt-1.5 hidden px-2 text-xs text-muted-foreground sm:block sm:mt-2">
                Press Enter to send • Shift + Enter for new line
            </p>
        </div>
    );
}
