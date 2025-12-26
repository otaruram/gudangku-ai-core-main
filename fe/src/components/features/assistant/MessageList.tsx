import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useChat";

interface MessageListProps {
    messages: Message[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, isTyping, messagesEndRef }: MessageListProps) {
    return (
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-full overflow-y-auto p-3 sm:p-4">
                <div className="mx-auto max-w-2xl space-y-3 sm:space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-2 sm:gap-3 w-full",
                                message.role === "user" ? "flex-row-reverse justify-start" : "flex-row justify-start"
                            )}
                        // Note: flex-row-reverse + justify-start = Aligned to RIGHT side visually
                        // flex-row + justify-start = Aligned to LEFT side visually
                        >
                            <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-accent text-accent-foreground"
                            )}>
                                {message.role === "user" ? (
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                            </div>

                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-[80%] sm:px-4 sm:py-2.5",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary"
                            )}>
                                <div className="whitespace-pre-wrap text-xs leading-relaxed sm:text-sm">
                                    {message.content.split('\n').map((line, i) => {
                                        // Simple markdown-like formatting for bold
                                        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        return (
                                            <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine + (i < message.content.split('\n').length - 1 ? '<br/>' : '') }} />
                                        );
                                    })}
                                </div>
                                <p className={cn(
                                    "mt-1 text-[10px]",
                                    message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                                )}>
                                    {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-2 sm:gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground sm:h-8 sm:w-8">
                                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <div className="rounded-2xl bg-secondary px-3 py-2 sm:px-4 sm:py-3">
                                <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s] sm:h-2 sm:w-2" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s] sm:h-2 sm:w-2" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
}
