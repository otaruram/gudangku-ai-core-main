interface PredictionStat {
    label: string;
    value: string;
    description: string;
}

interface PredictionStatsProps {
    stats: PredictionStat[];
}

export function PredictionStats({ stats }: PredictionStatsProps) {
    return (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {stats.map((stat, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                    <p className="mt-0.5 text-xl font-bold text-accent sm:mt-1 sm:text-2xl">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">{stat.description}</p>
                </div>
            ))}
        </div>
    );
}
