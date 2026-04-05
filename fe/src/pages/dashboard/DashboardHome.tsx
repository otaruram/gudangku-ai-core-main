import { useForecast } from "@/context/ForecastContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, 
  ArrowRight, Zap, Package, Calendar, Upload, MessageSquare,
  ExternalLink, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// WhatsApp message generator
function generateWAMessage(alert: any): string {
  const qty = alert.rop ? Math.max(alert.rop * 2, 50) : 100;
  return encodeURIComponent(
    `Halo, kami dari Gudangku ingin melakukan pemesanan:\n\n` +
    `📦 Produk: *${alert.product}*\n` +
    `🔢 Qty yang dibutuhkan: *${qty} unit*\n` +
    `⚠️ Status stok kami: ${alert.status === 'CRITICAL' ? 'KRITIS' : 'PERLU RESTOCK'} (sisa ${alert.current_stock} unit)\n` +
    `📅 Target terima: *dalam ${Math.max(1, alert.days_left - 1)} hari ke depan*\n\n` +
    `Bisa tolong konfirmasi ketersediaan dan harga terbaik? Terima kasih 🙏`
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data } = useForecast();
  const { forecastChart, bestSellers, stockAlerts, hasData } = data;

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
    localStorage.setItem('assistant_prompt', prompt);
    navigate('/dashboard/assistant');
  };

  const handleOrderNow = (productName: string) => {
    const query = encodeURIComponent(productName);
    window.open(`https://www.tokopedia.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const csvFileName = localStorage.getItem('csvFileName');

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
                      localStorage.setItem('assistant_prompt', prompt);
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
                      onClick={() => window.open(`https://t.me/GudangkuAIBot`, '_blank', 'noopener,noreferrer')}
                    >
                      <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-green-500/40 text-green-600 hover:bg-green-500/10 dark:text-green-400"
                      onClick={() => window.open(`https://wa.me/?text=${generateWAMessage(alert)}`, '_blank', 'noopener,noreferrer')}
                    >
                      <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
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
        </>
      )}
    </div>
  );
}
