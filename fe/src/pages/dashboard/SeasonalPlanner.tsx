import { useState } from "react";
import { useForecast } from "@/context/ForecastContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Zap, AlertTriangle, ShoppingCart, MessageSquare, ExternalLink, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "@/lib/config";
import { getSessionData } from "@/lib/sessionData";

const EVENTS = [
  { id: "lebaran", label: "Lebaran / Idul Fitri", emoji: "🌙", multiplier: 2.8, note: "Lonjakan demand 180-280% untuk bahan pokok" },
  { id: "natal", label: "Natal & Tahun Baru", emoji: "🎄", multiplier: 1.8, note: "Lonjakan 60-80%, terutama produk premium & minuman" },
  { id: "harbolnas", label: "Harbolnas 12.12", emoji: "🛍️", multiplier: 2.2, note: "Puncak belanja online, +120% dari baseline" },
  { id: "tahun_baru_imlek", label: "Tahun Baru Imlek", emoji: "🧧", multiplier: 1.6, note: "+50-60% untuk produk sembako & snack" },
  { id: "kemerdekaan", label: "HUT RI 17 Agustus", emoji: "🇮🇩", multiplier: 1.4, note: "+30-40% untuk produk hajatan & minuman" },
  { id: "custom", label: "Event Custom", emoji: "📅", multiplier: 1.5, note: "Masukkan nama event dan estimasi lonjakan sendiri" },
];

interface SimResult {
  product: string;
  current_stock: number;
  baseline_daily: number;
  predicted_daily: number;
  days_cover: number;
  status: "AMAN" | "PERLU_RESTOCK" | "KRITIS";
  reorder_qty: number;
  estimated_budget: number;
}

export default function SeasonalPlanner() {
  const { data } = useForecast();
  const navigate = useNavigate();
  const { bestSellers, stockAlerts, hasData } = data;

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [customEventName, setCustomEventName] = useState("");
  const [customMultiplier, setCustomMultiplier] = useState("1.5");
  const [eventDays, setEventDays] = useState("14");
  const [results, setResults] = useState<SimResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const event = EVENTS.find(e => e.id === selectedEvent);

  const runSimulation = () => {
    if (!hasData || !selectedEvent) return;
    setLoading(true);
    setResults(null);
    setAiAdvice(null);

    const multiplier = selectedEvent === "custom" ? parseFloat(customMultiplier) || 1.5 : event!.multiplier;
    const days = parseInt(eventDays) || 14;

    // Build results from bestSellers + stockAlerts
    const simResults: SimResult[] = bestSellers.map((item: any) => {
      const alert = stockAlerts.find((a: any) => a.product === item.name);
      const currentStock = alert?.current_stock ?? 0;
      // Estimate baseline daily from rop or qty
      const baselineDaily = alert?.rop ? alert.rop / 14 : Math.max(1, item.qty / 90);
      const predictedDaily = baselineDaily * multiplier;
      const daysCover = predictedDaily > 0 ? Math.floor(currentStock / predictedDaily) : 999;

      let status: SimResult["status"] = "AMAN";
      if (daysCover < days * 0.5) status = "KRITIS";
      else if (daysCover < days) status = "PERLU_RESTOCK";

      const needed = Math.ceil(predictedDaily * days);
      const reorderQty = Math.max(0, needed - currentStock);
      // Rough price estimate: 5000/unit (generic UMKM goods avg)
      const estimatedBudget = reorderQty * 5000;

      return {
        product: item.name,
        current_stock: currentStock,
        baseline_daily: parseFloat(baselineDaily.toFixed(1)),
        predicted_daily: parseFloat(predictedDaily.toFixed(1)),
        days_cover: daysCover,
        status,
        reorder_qty: reorderQty,
        estimated_budget: estimatedBudget,
      };
    });

    // Sort: KRITIS > PERLU_RESTOCK > AMAN
    simResults.sort((a, b) => {
      const order = { KRITIS: 0, PERLU_RESTOCK: 1, AMAN: 2 };
      return order[a.status] - order[b.status];
    });

    setTimeout(() => {
      setResults(simResults);
      setLoading(false);
    }, 600);
  };

  const getAIAdvice = async () => {
    if (!results || !selectedEvent) return;
    setAiLoading(true);
    const eventLabel = selectedEvent === "custom" ? customEventName || "Event Custom" : event!.label;
    const criticalItems = results.filter(r => r.status !== "AMAN");
    const prompt = `Saya adalah pemilik UMKM yang mempersiapkan stok untuk ${eventLabel} (${eventDays} hari ke depan).

Hasil simulasi demand saya:
${criticalItems.slice(0, 8).map(r => `- ${r.product}: stok ${r.current_stock}, prediksi butuh ${r.reorder_qty} unit tambahan, budget ~Rp${(r.estimated_budget / 1000).toFixed(0)}rb`).join('\n')}

Berikan:
1. Prioritas restock (mana yang paling urgent dan kenapa)
2. Tips negosiasi dengan supplier untuk volume besar
3. Strategi cash flow untuk pembelian bulk sebelum event
4. Produk mana yang sebaiknya distok berlebih sebagai buffer`;

    try {
      const authHeaders = await getAuthHeaders();
      const csvContext = getSessionData("csvContext") || "";
      const fullQuestion = csvContext
        ? `INVENTORY DATA:\n${csvContext}\n\nEVENT SIMULATION REQUEST:\n${prompt}`
        : prompt;

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ question: fullQuestion }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as any));
        if (res.status === 429) {
          const retrySec = Math.ceil((errBody.retry_after_ms ?? 0) / 1000);
          setAiAdvice(
            `Rate limit aktif. Coba lagi dalam ${retrySec > 0 ? retrySec : 10} detik.\n\n` +
            `Tip: Pertanyaan yang sama biasanya kena cache Redis dan tidak potong kredit.`
          );
        } else {
          setAiAdvice(errBody.error || "Tidak dapat memproses strategi AI saat ini.");
        }
        return;
      }

      const d = await res.json();
      const cachedNote = d.cached ? "\n\nCached response (gratis, tidak potong kredit)." : "";
      setAiAdvice((d.response || "") + cachedNote);
    } catch {
      setAiAdvice("Tidak dapat terhubung ke AI. Pastikan kamu sudah login dan memiliki kredit.");
    } finally {
      setAiLoading(false);
    }
  };

  const eventLabel = selectedEvent === "custom"
    ? customEventName || "Event Custom"
    : event?.label || "";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border shrink-0" style={{ borderColor: "var(--color-warning)", backgroundColor: "rgba(245, 158, 11, 0.12)" }}>
            <Calendar className="h-5 w-5" style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text-primary)" }}>Event Simulator</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Prediksi kebutuhan stok sebelum event besar — Lebaran, Harbolnas, dan lainnya
            </p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">Data Belum Ada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Upload CSV terlebih dahulu agar simulator bisa menghitung kebutuhan stok berdasarkan data penjualan kamu.
          </p>
          <Button className="mt-5" onClick={() => navigate("/dashboard/upload")}>
            Upload CSV Sekarang
          </Button>
        </div>
      ) : (
        <>
          {/* Event Selector */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Pilih Event</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EVENTS.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedEvent(ev.id); setResults(null); setAiAdvice(null); }}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                    selectedEvent === ev.id
                      ? "ring-1"
                      : "hover:opacity-90"
                  )}
                  style={selectedEvent === ev.id
                    ? { borderColor: "var(--color-warning)", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "var(--color-text-primary)" }
                    : { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)", color: "var(--color-text-primary)" }}
                >
                  <span className="text-xl">{ev.emoji}</span>
                  <span className="text-xs font-semibold leading-tight">{ev.label}</span>
                  <span className="text-[10px] leading-tight" style={{ color: "var(--color-text-muted)" }}>{ev.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom event input */}
          {selectedEvent === "custom" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={customEventName}
                onChange={e => setCustomEventName(e.target.value)}
                placeholder="Nama event (mis. Pernikahan Massal)"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Multiplier:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={customMultiplier}
                  onChange={e => setCustomMultiplier(e.target.value)}
                  className="w-20 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">x</span>
              </div>
            </div>
          )}

          {/* Duration + Run */}
          {selectedEvent && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Durasi persiapan:</span>
                <select
                  value={eventDays}
                  onChange={e => setEventDays(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[7, 14, 21, 30].map(d => (
                    <option key={d} value={d}>{d} hari</option>
                  ))}
                </select>
              </div>
              <Button onClick={runSimulation} disabled={loading} className="gap-2">
                <Zap className="h-4 w-4" />
                {loading ? "Memproses..." : "Simulasi Sekarang"}
              </Button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-destructive/15 px-3 py-1 text-destructive font-medium">
                  🚨 Kritis: {results.filter(r => r.status === "KRITIS").length} produk
                </span>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Perlu Restock: {results.filter(r => r.status === "PERLU_RESTOCK").length} produk
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  ✅ Aman: {results.filter(r => r.status === "AMAN").length} produk
                </span>
              </div>

              {/* Table */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                        <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Produk</th>
                        <th className="text-right px-4 py-3 font-medium hidden sm:table-cell" style={{ color: "var(--color-text-muted)" }}>Stok</th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>Prediksi/hari</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Reorder</th>
                        <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Status</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{r.product}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{r.current_stock}</td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className="text-muted-foreground line-through text-xs mr-1">{r.baseline_daily}</span>
                            <span className="font-medium text-amber-500">{r.predicted_daily}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {r.reorder_qty > 0 ? (
                              <span className="text-destructive">{r.reorder_qty} unit</span>
                            ) : (
                              <span className="text-emerald-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              r.status === "KRITIS" && "bg-destructive/15 text-destructive",
                              r.status === "PERLU_RESTOCK" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                              r.status === "AMAN" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            )}>
                              {r.status === "KRITIS" ? "KRITIS" : r.status === "PERLU_RESTOCK" ? "RESTOCK" : "AMAN"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.reorder_qty > 0 && (
                              <button
                                onClick={() => window.open(`https://t.me/Kang_Supply_Bot`, '_blank', 'noopener,noreferrer')}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                TG
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Advice Button */}
              {results.some(r => r.status !== "AMAN") && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">Mau strategi restock yang optimal?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI akan analisis prioritas, tips negosiasi supplier, dan strategi cash flow untuk {eventLabel}.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={getAIAdvice}
                      disabled={aiLoading}
                      className="gap-2 shrink-0"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      {aiLoading ? "Menganalisis..." : "Minta Strategi AI"}
                    </Button>
                  </div>

                  {aiAdvice && (
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-2">Analisis AI — {eventLabel}</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{aiAdvice}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
