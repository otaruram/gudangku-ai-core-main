

import { useState } from "react";
import { Info, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { UploadZone } from "@/components/features/forecast/UploadZone";
import { useForecast } from "@/context/ForecastContext";

// Theme Colors
const COLORS = {
  emerald: "#10b981",
  black: "#000000",
  gray: "#9ca3af",
  white: "#ffffff",
  bar_success: "#10b981",
  bar_danger: "#ef4444"
};

export default function Forecaster() {
  // Use Context instead of Local State
  const { data, setData } = useForecast();

  // Local loading state is fine
  const [loading, setLoading] = useState(false);

  const handleFileProcess = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const API_URL = import.meta.env.VITE_API_URL || "https://gudangku-ai.onrender.com";
      const response = await fetch(`${API_URL}/api/forecast/365`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Forecast failed");
      }

      const responseData = await response.json();

      // 1. Parse Forecast Chart
      const mappedForecast = responseData.forecast_chart.map((item: any) => ({
        date: new Date(item.ds).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        value: Math.round(item.yhat)
      }));

      // 2. Parse Best Sellers
      const best = Object.entries(responseData.best_sellers || {}).map(([name, qty]) => ({
        name, qty
      }));

      // 3. Update Global Context
      setData({
        forecastChart: mappedForecast,
        bestSellers: best,
        stockAlerts: responseData.stock_alerts || [],
        hasData: true
      });

    } catch (error: any) {
      console.error("Forecast Error:", error);
      alert(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const { hasData, forecastChart, bestSellers, stockAlerts } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Engine</h1>
          <p className="text-muted-foreground mt-1">Supply Chain Decision Support System</p>
        </div>
        {!hasData && !loading && (
          <div className="text-right">
            <span className="text-xs bg-black text-white px-2 py-1 rounded">PROPHET v1.5</span>
          </div>
        )}
        {hasData && (
          <button
            onClick={() => {
              if (confirm("Ganti File? Analisis saat ini akan dihapus dari tampilan (tetap tersimpan di History).")) {
                setData({ ...data, hasData: false, forecastChart: [], bestSellers: [], stockAlerts: [] });
              }
            }}
            className="text-sm font-medium text-destructive hover:underline border border-destructive/20 rounded-md px-3 py-1 bg-destructive/5"
          >
            Ganti File / Reset
          </button>
        )}
      </div>

      {/* UPLOAD SECTION (Initial State) */}
      {!hasData && (
        <div className="max-w-2xl mx-auto mt-12">
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <UploadZone
              isDragging={false}
              onDragOver={() => { }}
              onDragLeave={() => { }}
              onDrop={() => { }}
              onFileSelect={handleFileProcess}
            />
            {loading && (
              <div className="text-center mt-6 space-y-2">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-black border-r-transparent"></div>
                <p className="text-sm font-medium">Decomposing Sales Data...</p>
                <p className="text-xs text-muted-foreground">Analisis Historis • Stok Velocity • Forecasting</p>
              </div>
            )}
            <div className="mt-8 p-4 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">Supported Columns (Auto-Detect):</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Date: <span className="font-mono bg-secondary px-1">tanggal</span>, <span className="font-mono bg-secondary px-1">date</span></li>
                <li>Sales: <span className="font-mono bg-secondary px-1">terjual</span>, <span className="font-mono bg-secondary px-1">qty</span>, <span className="font-mono bg-secondary px-1">sales</span></li>
                <li>Product: <span className="font-mono bg-secondary px-1">nama</span>, <span className="font-mono bg-secondary px-1">product</span>, <span className="font-mono bg-secondary px-1">item</span></li>
                <li>Stock: <span className="font-mono bg-secondary px-1">sisa</span>, <span className="font-mono bg-secondary px-1">stok</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD (Result State) */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ZONE 1: WINNERS & LOSERS (Top Left) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border rounded-xl p-5 shadow-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2 className="font-bold text-lg">Top Performers</h2>
              </div>
              {bestSellers.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bestSellers} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                        {bestSellers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index < 3 ? COLORS.emerald : COLORS.gray} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada data produk.</p>
              )}
              <p className="text-xs text-muted-foreground mt-4 italic">
                *Produk dengan kontribusi margin tertinggi (pareto principle)
              </p>
            </div>
          </div>

          {/* ZONE 2: FUTURE PROJECTION (Top Right / Center) */}
          <div className="lg:col-span-2">
            <div className="bg-black text-white rounded-xl p-6 shadow-xl h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Market Trajectory 2026</h2>
                  <div className="flex items-center gap-2 text-emerald-400 mt-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm font-medium">Predicted Growth Trend</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold tracking-tighter">1 Year</p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Horizon</p>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastChart}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#333"
                      tick={{ fill: '#666', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={COLORS.white}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ZONE 3: STOCK ACTIONS (Bottom Full Width) */}
          <div className="lg:col-span-3">
            <div className="border rounded-xl p-6 bg-secondary/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Stock Velocity Analysis
                </h2>
                <button
                  onClick={() => setData({ hasData: false })}
                  className="text-sm font-medium hover:underline"
                >
                  Reset Analysis
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockAlerts.length > 0 ? stockAlerts.map((item, i) => (
                  <div key={i} className="bg-white border p-4 rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm">{item.product}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Stok: {item.current_stock}</p>
                    </div>
                    <div className="text-right">
                      {item.status === 'CRITICAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Run Out in {item.days_left}d
                        </span>
                      ) : item.status === 'WARNING' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          {item.days_left} days left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Safe
                        </span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No stock data available in CSV.</p>
                    <p className="text-xs">Include 'product' and 'stock' columns to see analysis.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
