import { Sparkles, Zap } from "lucide-react";

export function AIStatus() {
    const csvFileName = localStorage.getItem('csvFileName');
    const hasCsv = !!localStorage.getItem('csvContext');

    return (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-accent sm:h-3 sm:w-3" />
                    <div className="absolute inset-0 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-accent sm:h-3 sm:w-3" />
                </div>
                <div>
                    <p className="text-xs font-medium sm:text-sm">Gemini 2.5 Flash</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">Cloud AI • Supply Chain Intelligence</p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1">
                {hasCsv ? (
                    <>
                        <Sparkles className="h-3 w-3 text-accent" />
                        <span className="text-[10px] font-medium text-accent sm:text-xs">CSV loaded: {csvFileName || 'data.csv'}</span>
                    </>
                ) : (
                    <>
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-[10px] font-medium text-yellow-600 sm:text-xs">No CSV — generic mode</span>
                    </>
                )}
            </div>
        </div>
    );
}
