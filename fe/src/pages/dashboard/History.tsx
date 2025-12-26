import { useState, useEffect } from "react";
import { Clock, TrendingUp, MessageSquare, RotateCcw, Eye, Download, Filter, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


// API URL
const API_URL = import.meta.env.VITE_API_URL || "https://gudangku-ai.onrender.com/api";

type HistoryType = "all" | "forecast" | "chat";

interface HistoryItem {
  id: string;
  type: "forecast" | "chat";
  title: string;
  description: string;
  timestamp: string; // API returns ISO string
  status: "success" | "failed" | "pending";
  metadata?: {
    accuracy?: number;
    messages?: number;
    products?: number;
  };
}

interface HistoryStats {
  total_predictions: number;
  total_consultations: number;
  avg_accuracy: string;
  response_time: string;
}

export default function History() {
  const [filter, setFilter] = useState<HistoryType>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null); // For detailed modal data
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Timeline
      const timelineRes = await fetch(`${API_URL}/history/all`);
      if (timelineRes.ok) {
        setItems(await timelineRes.json());
      }

      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/history/stats`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = async (item: HistoryItem) => {
    setSelectedItem(item);
    setIsViewOpen(true);
    setDetailLoading(true);
    try {
      // Fetch specific detail based on type
      const endpoint = item.type === 'forecast' ? `/history/forecast/${item.id}` : `/history/chat/${item.id}`;
      const res = await fetch(`${API_URL}${endpoint}`);
      if (res.ok) {
        setDetailData(await res.json());
      }
    } catch (e) { console.error(e) }
    finally { setDetailLoading(false); }
  }

  const handleReplay = async (item: HistoryItem) => {
    setSelectedItem(item);
    setIsReplayOpen(true);
    setDetailLoading(true);
    try {
      // Re-simulation often means just showing the same data but in an "active" way
      // For now we fetch the same detail data
      const endpoint = item.type === 'forecast' ? `/history/forecast/${item.id}` : `/history/chat/${item.id}`;
      const res = await fetch(`${API_URL}${endpoint}`);
      if (res.ok) {
        setDetailData(await res.json());
      }
    } catch (e) { console.error(e) }
    finally { setDetailLoading(false); }
  }

  const filteredData = items.filter(item =>
    filter === "all" || item.type === filter
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hari ini";
    if (days === 1) return "Kemarin";
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Memori Strategis</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Audit Trail Keputusan AI & Operasional</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Audit
          </Button>
        </div>
      </div>

      {/* Stats Summary - Dynamic */}
      <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-4">
        {[
          { label: "Total Prediksi", value: stats?.total_predictions ?? "-", icon: TrendingUp },
          { label: "Total Konsultasi", value: stats?.total_consultations ?? "-", icon: MessageSquare },
          { label: "Rata-rata Akurasi", value: stats?.avg_accuracy ?? "-", icon: TrendingUp },
          { label: "Waktu Respon", value: stats?.response_time ?? "-", icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <stat.icon className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
              <span className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</span>
            </div>
            <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex rounded-lg border border-border p-1">
            {[
              { key: "all", label: "Semua Aktivitas" },
              { key: "forecast", label: "Forecaster Log" },
              { key: "chat", label: "Consultation Log" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as HistoryType)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-sm",
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground sm:ml-auto sm:text-sm">
          {filteredData.length} items found
        </span>
      </div>

      {/* History List */}
      <div className="rounded-xl border border-border bg-card min-h-[300px]">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Retrieving Strategic Memory...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No history records found.</p>
            <p className="text-xs">Try uploading a CSV or chatting with the Assistant.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-3 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                {/* Left Section */}
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                    item.type === "forecast" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {item.type === "forecast" ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs",
                        item.status === "success" && "bg-emerald-500/10 text-emerald-500",
                        item.status === "failed" && "bg-destructive/10 text-destructive",
                      )}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm line-clamp-1">{item.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground sm:mt-2 sm:gap-4 sm:text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.timestamp)} • {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.metadata?.accuracy && (
                        <span className="text-emerald-500 font-medium">
                          Akurasi: {item.metadata.accuracy}%
                        </span>
                      )}
                      {item.metadata?.products && (
                        <span>{item.metadata.products} items analyzed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm" onClick={() => handleView(item)}>
                    <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Lihat
                  </Button>
                  {item.type === 'forecast' && (
                    <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 sm:h-9 sm:text-sm" onClick={() => handleReplay(item)}>
                      <RotateCcw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Replay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODAL (DETAILS) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              Recorded on {selectedItem?.timestamp && new Date(selectedItem.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 border rounded-lg p-4 bg-secondary/20 max-h-[60vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : detailData ? (
              selectedItem?.type === 'chat' ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="font-semibold text-xs text-primary mb-1">User Question:</p>
                    <p className="text-sm">{detailData.question}</p>
                  </div>
                  <div className="bg-background border p-3 rounded-lg">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">AI Response:</p>
                    <div className="text-sm prose dark:prose-invert max-w-none">
                      {detailData.answer}
                    </div>
                  </div>
                </div>
              ) : (
                // Forecast Detail View
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filename</span>
                    <span className="text-sm text-muted-foreground">{detailData.filename}</span>
                  </div>
                  {/* We could show raw data table here or summary */}
                  <div className="p-4 bg-secondary rounded text-center text-sm text-muted-foreground">
                    Full forecast data available. Click Replay to visualize.
                  </div>
                </div>
              )
            ) : (
              <p className="text-center text-muted-foreground">Failed to load details.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* REPLAY MODAL (VISUALIZATION) */}
      <Dialog open={isReplayOpen} onOpenChange={setIsReplayOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-500" />
              Visual Re-simulation
            </DialogTitle>
            <DialogDescription>
              Replaying {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 min-h-[400px]">
            {detailLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : (
              // Logic: Check if we have plotData. It might be nested in 'chart' key based on prophet_service.py line 201
              // structure: { chart: [...], best_sellers: ..., stock_alerts: ... }
              // OR it might be just the array if older data.
              // We need to robustly handle both.
              (() => {
                const rawData = detailData?.plotData;

                // If rawData itself is the array
                let chartData = Array.isArray(rawData) ? rawData : [];

                // If it's the new object structure { chart: ... }
                if (!chartData.length && rawData?.chart) {
                  chartData = rawData.chart;
                }

                // If chartData is empty, maybe it's in a different format or missing
                if (!chartData || chartData.length === 0) {
                  return <p className="text-center text-muted-foreground p-12">Simulasi visual tidak tersedia untuk data ini (Format Data Invalid atau Kosong).</p>;
                }

                return (
                  <div className="h-[400px] w-full bg-card border rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="replayGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="ds"
                          tickFormatter={(val) => {
                            // Handle ISO string to short date
                            try { return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }
                            catch { return val; }
                          }}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          formatter={(val: number) => [Math.round(val), "Prediksi Sales"]}
                        />
                        <Area type="monotone" dataKey="yhat" stroke="#10b981" fillOpacity={1} fill="url(#replayGreen)" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-center text-xs text-muted-foreground mt-2">Replayed from historical snapshot</p>
                  </div>
                );
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
