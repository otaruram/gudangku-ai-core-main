import { Sparkles } from "lucide-react";

export function AIStatus() {
    return (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-accent sm:h-3 sm:w-3" />
                    <div className="absolute inset-0 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-accent sm:h-3 sm:w-3" />
                </div>
                <div>
                    <p className="text-xs font-medium sm:text-sm">Local Brain Active</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">Ollama + llama3 • Data aman, offline</p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-medium text-accent sm:text-xs">128 dokumen terindex</span>
            </div>
        </div>
    );
}
