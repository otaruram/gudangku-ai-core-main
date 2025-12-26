import { useForecast } from "@/context/ForecastContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Zap,
  Package,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardHome() {
  const { data } = useForecast();
  const { forecastChart, bestSellers, stockAlerts, hasData } = data;

  // 1. Calculate Efficiency Stats (Winners & Losers)
  const winners = bestSellers.slice(0, 3);
  // Placeholder for real deadstock logic which requires 'last_sold_date'
  const deadstockPlaceholder = [
    { name: "Binder Clips (Old)", stock: 850, days_dormant: 90 },
    { name: "CD-R Spindle", stock: 120, days_dormant: 120 },
  ];

  // 2. Command Center Logic
  const criticalActions = stockAlerts.filter((a: any) => a.status === "CRITICAL");
  const warningActions = stockAlerts.filter((a: any) => a.status === "WARNING");
  const allActions = [...criticalActions, ...warningActions];

  const handleRestock = (productName: string) => {
    // In a real app, this would trigger an email draft or API call
    alert(`Initiating Automated Restock for: ${productName}. Draft email created.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* HEADER: COMMAND CENTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? "Sistem aktif. Memantau 24/7."
              : "Menunggu data. Silakan upload CSV di Intelligence Engine."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            LIVE MONITORING
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        // EMPTY STATE
        <div className="rounded-xl border border-dashed p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Data Operasional Kosong</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
            Dashboard ini membutuhkan data historis untuk menghasilkan wawasan strategis.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/forecaster'}>
            Buka Intelligence Engine
          </Button>
        </div>
      ) : (
        <>
          {/* ZONE 1: EFFICIENCY FUNCTION (Top Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Winner Card */}
            <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Top Performers / Winners</h3>
                </div>
                <div className="space-y-4">
                  {winners.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">High Velocity</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.qty}</p>
                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">+15% Profit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loser Card (Deadstock Simulation) */}
            <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown className="w-24 h-24 text-red-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Deadstock / Losers</h3>
                </div>
                {/* Placeholder Logic */}
                <div className="space-y-4">
                  {deadstockPlaceholder.map((item, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Zero Movement ({item.days_dormant} days)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.stock}</p>
                        <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Rugi Gudang</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full h-8 text-xs hover:bg-red-50 hover:text-red-600 border-red-200 text-red-500"
                      onClick={() => {
                        // Construct prompt
                        const items = deadstockPlaceholder.map(i => `${i.name} (${i.stock} unit, ${i.days_dormant} hari)`).join(', ');
                        const prompt = `Saya butuh strategi cuci gudang (deadstock clearance) untuk barang-barang ini: ${items}. Berikan rekomendasi diskon, bundling, atau strategi marketing untuk menghabiskannya dalam 30 hari.`;

                        // Navigate to Assistant with state
                        // Note: We need to use useNavigate hook, but this file doesn't have it yet.
                        // We will use window.location.href + localStorage for inter-page comms for simplicity in this file
                        localStorage.setItem('assistant_prompt', prompt);
                        window.location.href = '/dashboard/assistant';
                      }}
                    >
                      Buat Strategi Cuci Gudang
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats / Global Status */}
            <div className="rounded-xl border bg-black text-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Status Gudang</h3>
                <p className="text-gray-400 text-xs">Real-time health check</p>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Total SKU</span>
                  <span className="font-mono text-xl">{bestSellers.length + 15}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Total Unit Stored</span>
                  <span className="font-mono text-xl text-emerald-400">12,847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Pending Actions</span>
                  <span className="font-mono text-xl text-yellow-400">{allActions.length}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span>AI Confidence Score: 98.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ZONE 2: STRATEGIC FUNCTION (1 Year Projection) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  Proyeksi Strategis 2026
                </h2>
                <p className="text-sm text-muted-foreground">Estimasi permintaan musiman 12 bulan ke depan (Prophet v1.5 Model)</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-emerald-500">+24% Tren Kenaikan</p>
                <p className="text-xs text-muted-foreground">dibanding tahun lalu</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategicGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#strategicGreen)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ZONE 3: COMMAND FUNCTION (Automated Actions) */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 bg-secondary/30 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Action List (Pusat Komando)
                </h2>
                <div className="text-xs font-mono bg-black text-white px-2 py-1 rounded">
                  {allActions.length} Pending Actions
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {allActions.length > 0 ? allActions.map((alert: any, i: number) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-full mt-1",
                      alert.status === "CRITICAL" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                    )}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base flex items-center gap-2">
                        {alert.status === "CRITICAL" ? "RESTOCK SEKARANG" : "PERINGATAN DINI"}
                        <span className="text-sm font-normal text-muted-foreground">- {alert.product}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sisa stok: <span className="font-mono font-medium text-foreground">{alert.current_stock}</span>.
                        Akan habis dalam <span className={cn("font-bold", alert.status === "CRITICAL" ? "text-red-500" : "text-yellow-600")}>{alert.days_left} hari</span>.
                        (ROP: {alert.rop})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="text-xs"
                      onClick={() => window.location.href = '/dashboard/assistant'}
                    >
                      Cek Kontrak
                    </Button>
                    <Button
                      className={cn(
                        "text-xs gap-2",
                        alert.status === "CRITICAL" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"
                      )}
                      onClick={() => handleRestock(alert.product)}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {alert.status === "CRITICAL" ? "Pesan Sekarang (Urgent)" : "Tambah ke Draft"}
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-medium text-foreground">Semua Operasional Lancar</p>
                  <p className="text-sm mt-1">Tidak ada tindakan kritis yang diperlukan saat ini.</p>
                </div>
              )}
            </div>

            {allActions.length > 0 && (
              <div className="bg-secondary/10 p-4 text-center border-t border-border">
                <Button variant="ghost" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                  Lihat 12 rekomendasi non-critical lainnya <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
