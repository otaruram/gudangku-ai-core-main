import { useForecast } from "@/context/ForecastContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, 
  ArrowRight, Zap, Package, Calendar, Upload, MessageSquare,
  ExternalLink, Info, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "@/lib/config";
import { getSessionData, setSessionData } from "@/lib/sessionData";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data } = useForecast();
  const { forecastChart, bestSellers, stockAlerts, hasData } = data;

  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgLinked, setTgLinked] = useState(false);
  const [tgCopied, setTgCopied] = useState(false);

  const generateTelegramCode = async () => {
    setTgLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
      const d = await res.json();
      if (d.already_linked) {
        setTgLinked(true);
      } else if (d.code) {
        setTgCode(d.code);
      }
    } catch { /* ignore */ }
    setTgLoading(false);
  };

  const copyCode = () => {
    if (!tgCode) return;
    navigator.clipboard.writeText(`/link ${tgCode}`);
    setTgCopied(true);
    setTimeout(() => setTgCopied(false), 2000);
  };

  const winners = bestSellers.slice(0, 3);

  // Deadstock = products with lowest sales from actual CSV data
  const deadstock = bestSellers.length > 0
    ? [...bestSellers].sort((a: any, b: any) => a.qty - b.qty).slice(0, 3)
    : [];

  const criticalActions = stockAlerts.filter((a: any) => a.status === "CRITICAL");
  const warningActions = stockAlerts.filter((a: any) => a.status === "WARNING");
  const allActions = [...criticalActions, ...warningActions];

  const handleAskAI = (alert: any) => {
    const prompt = [
      `Product: ${alert.product}`,
      `Current Stock: ${alert.current_stock} units`,
      `Reorder Point (ROP): ${alert.rop} units`,
      `Days Until Stockout: ${alert.days_left} days`,
      `Status: ${alert.status}`,
      ``,
      `Based on this data, please provide:`,
      `1. Optimal reorder quantity (EOQ)`,
      `2. Recommended order timing`,
      `3. Supplier contract negotiation tips`,
      `4. Safety stock recommendation`,
    ].join('\n');
    setSessionData('assistant_prompt', prompt);
    navigate('/dashboard/assistant');
  };

  const handleOrderNow = (productName: string) => {
    const query = encodeURIComponent(productName);
    window.open(`https://www.tokopedia.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const csvFileName = getSessionData('csvFileName');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `System active. Monitoring 24/7.${csvFileName ? ` Data: ${csvFileName}` : ''}`
              : "Upload a CSV file to activate all features."}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
          {hasData ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              LIVE MONITORING
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-medium border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              AWAITING DATA
            </div>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-8 sm:p-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Operational Data</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Upload a CSV file in the Forecaster to activate the Dashboard, Doc Assistant, History, and Stock Alerts.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>CSV format: <span className="font-mono bg-secondary px-1">date, product, sales, stock</span></p>
          </div>
          <Button 
            className="mt-6" 
            onClick={() => navigate('/dashboard/upload')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV Data
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {/* ... Winner Card ... */}

            {/* Deadstock Card — from actual CSV data */}
            <div className="rounded-xl border bg-card p-6 shadow-sm relative group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Deadstock / Losers</h3>
                <div className="group/tip relative">
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  <div className="absolute right-0 top-6 w-48 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border hidden group-hover/tip:block z-10">
                    Products with the lowest total sales from your CSV data.
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {deadstock.length > 0 ? deadstock.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b border-border/50">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.qty} sold</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No product data in CSV.</p>
                )}
                {deadstock.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      const prompt = `Need a clearance strategy for slow-moving products: ${deadstock.map((i: any) => `${i.name} (${i.qty} sold)`).join(', ')}. Suggest discount strategies, bundle ideas, or liquidation approaches.`;
                      setSessionData('assistant_prompt', prompt);
                      navigate('/dashboard/assistant');
                    }}
                  >
                    Create Clearance Strategy
                  </Button>
                )}
              </div>
            </div>
            
            {/* ... Warehouse Status Card ... */}
          </div>

          {/* ... Strategic Projection 2026 ... */}

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 bg-secondary/30 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">Action List</h2>
                <div className="group/tip relative">
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  <div className="absolute right-0 top-6 w-56 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border hidden group-hover/tip:block z-10">
                    Products that need restocking based on stock velocity from your CSV. "Ask AI" sends context to Doc Assistant. "Telegram" opens AI bot chat. "Order" searches Tokopedia.
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {allActions.length > 0 ? allActions.map((alert: any, i: number) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="font-bold">{alert.product}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {alert.current_stock} · {alert.status === 'CRITICAL' ? `Runs out in ${alert.days_left}d` : `${alert.days_left} days left`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAskAI(alert)}
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Ask AI
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                      onClick={() => window.open(`https://t.me/Kang_Supply_Bot`, '_blank', 'noopener,noreferrer')}
                    >
                      <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleOrderNow(alert.product)}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Order
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No critical/warning stock alerts. All products are safe.
                </div>
              )}
            </div>
          </div>

          {/* Telegram Bot Link Card */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-sm">Telegram Bot — Kang Supply</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tanya stok, analisis foto/PDF, dan strategi supply chain langsung dari Telegram.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                {tgLinked ? (
                  <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Terhubung
                  </span>
                ) : tgCode ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-background border px-3 py-1.5 rounded-lg select-all">/link {tgCode}</code>
                      <button onClick={copyCode} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        {tgCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Kirim kode ini ke <a href="https://t.me/Kang_Supply_Bot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@Kang_Supply_Bot</a></p>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={generateTelegramCode} disabled={tgLoading} className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400">
                    {tgLoading ? "Generating..." : "Hubungkan Telegram"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
