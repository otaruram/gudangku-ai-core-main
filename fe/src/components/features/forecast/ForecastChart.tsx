import { Sparkles } from "lucide-react";

interface ChartData {
    month: string;
    actual: number | null;
    predicted: number | null;
}

interface ForecastChartProps {
    data: ChartData[];
}

export function ForecastChart({ data }: ForecastChartProps) {
    const maxValue = Math.max(...data.map(d => d.actual || d.predicted || 0));

    return (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold sm:text-base">Grafik Prediksi Stok</h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">Data historis vs prediksi AI</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-foreground sm:h-3 sm:w-3" />
                        <span className="text-xs sm:text-sm">Data Aktual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-accent sm:h-3 sm:w-3" />
                        <span className="text-xs sm:text-sm">Prediksi AI</span>
                    </div>
                </div>
            </div>

            {/* Simple Chart Visualization */}
            <div className="h-40 w-full sm:h-64">
                <div className="flex h-full items-end justify-between gap-1 sm:gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
                            <div
                                className="relative w-full"
                                style={{ height: `${((item.actual || item.predicted || 0) / maxValue) * 120}px` }}
                            >
                                {item.actual ? (
                                    <div
                                        className="absolute bottom-0 w-full rounded-t bg-foreground transition-all hover:opacity-80"
                                        style={{ height: "100%" }}
                                    />
                                ) : (
                                    <div
                                        className="absolute bottom-0 w-full rounded-t border-2 border-dashed border-accent bg-accent/20 transition-all hover:bg-accent/30"
                                        style={{ height: "100%" }}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground sm:text-xs">{item.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* The "Future Line" indicator */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent/10 p-2 sm:mt-4 sm:p-3">
                <Sparkles className="h-3 w-3 text-accent sm:h-4 sm:w-4" />
                <span className="text-xs font-medium text-accent sm:text-sm">
                    Garis putus-putus menunjukkan prediksi masa depan
                </span>
            </div>
        </div>
    );
}
