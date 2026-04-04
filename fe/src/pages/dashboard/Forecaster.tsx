

import { useState } from "react";
import { Info, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Download, HelpCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { UploadZone } from "@/components/features/forecast/UploadZone";
import { useForecast } from "@/context/ForecastContext";
import { Button } from "@/components/ui/button";

// Theme Colors
const COLORS = {
  emerald: "#10b981",
  black: "#000000",
  gray: "#9ca3af",
  white: "#ffffff",
  bar_success: "#10b981",
  bar_danger: "#ef4444"
};

// Sample CSV for users to download
const SAMPLE_CSV = `date,product,sales,stock
2025-01-01,Widget A,120,500
2025-01-01,Widget B,85,300
2025-01-01,Gadget C,200,150
2025-01-02,Widget A,135,380
2025-01-02,Widget B,90,210
2025-01-02,Gadget C,180,100
2025-01-03,Widget A,110,270
2025-01-03,Widget B,95,115
2025-01-03,Gadget C,220,50
2025-01-04,Widget A,140,130
2025-01-04,Widget B,75,40
2025-01-04,Gadget C,190,30
2025-01-05,Widget A,125,500
2025-01-05,Widget B,100,300
2025-01-05,Gadget C,210,200
2025-01-06,Widget A,130,370
2025-01-06,Widget B,88,212
2025-01-06,Gadget C,195,100
2025-01-07,Widget A,145,225
2025-01-07,Widget B,92,120
2025-01-07,Gadget C,205,50`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_inventory.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Forecaster() {
  // Use Context instead of Local State
  const { data, setData } = useForecast();

  // Local loading & drag state
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = async (file: File) => {
    setLoading(true);
    try {
      // Read CSV text for context sharing with Doc Assistant
      const csvText = await file.text();
      const csvLines = csvText.split('\n');
      // Store first row (header) + summary for AI context
      const header = csvLines[0];
      const rowCount = csvLines.length - 1;
      const sampleRows = csvLines.slice(1, 6).join('\n');
      const csvSummary = `File: ${file.name}\nColumns: ${header}\nTotal rows: ${rowCount}\nSample data:\n${sampleRows}`;
      localStorage.setItem('csvContext', csvSummary);
      localStorage.setItem('csvFileName', file.name);

      const formData = new FormData();
      formData.append("file", file);

      const { API_URL, getAuthHeaders } = await import("@/lib/config");
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_URL}/forecast/365`, {
        method: "POST",
        headers: { ...authHeaders },
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Forecast failed";
        try {
          const errorData = await response.json();
          errMsg = errorData.error || errorData.detail || errMsg;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const responseData = await response.json();

      // 1. Parse Forecast Chart
      const mappedForecast = responseData.forecast_chart.map((item: any) => ({
        date: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
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
      alert(`Failed: ${error.message}`);
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
              if (confirm("Change File? Current analysis will be removed from view (still saved in History).")) {
                setData({ ...data, hasData: false, forecastChart: [], bestSellers: [], stockAlerts: [] });
              }
            }}
            className="text-sm font-medium text-destructive hover:underline border border-destructive/20 rounded-md px-3 py-1 bg-destructive/5"
          >
            Change File / Reset
          </button>
        )}
      </div>

      {/* UPLOAD SECTION (Initial State) */}
      {!hasData && (
        <div className="max-w-2xl mx-auto mt-12">
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <UploadZone
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.csv')) {
                  handleFileProcess(file);
                } else {
                  alert("Please upload a .csv file");
                }
              }}
              onFileSelect={handleFileProcess}
            />
            {loading && (
              <div className="text-center mt-6 space-y-2">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-black border-r-transparent"></div>
                <p className="text-sm font-medium">Decomposing Sales Data...</p>
                <p className="text-xs text-muted-foreground">Historical Analysis • Stock Velocity • Forecasting</p>
              </div>
            )}
            <div className="mt-8 p-4 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-foreground">Required CSV Format:</p>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadSampleCSV}>
                  <Download className="h-3 w-3" />
                  Download Sample CSV
                </Button>
              </div>
              <p className="mb-2">Your CSV must have these columns (names are auto-detected):</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Date</strong> (required): <span className="font-mono bg-secondary px-1">date</span>, <span className="font-mono bg-secondary px-1">tanggal</span>, <span className="font-mono bg-secondary px-1">ds</span></li>
                <li><strong>Sales/Quantity</strong> (required): <span className="font-mono bg-secondary px-1">sales</span>, <span className="font-mono bg-secondary px-1">qty</span>, <span className="font-mono bg-secondary px-1">quantity</span>, <span className="font-mono bg-secondary px-1">y</span></li>
                <li><strong>Product</strong> (recommended): <span className="font-mono bg-secondary px-1">product</span>, <span className="font-mono bg-secondary px-1">item</span>, <span className="font-mono bg-secondary px-1">name</span>, <span className="font-mono bg-secondary px-1">sku</span></li>
                <li><strong>Stock</strong> (recommended): <span className="font-mono bg-secondary px-1">stock</span>, <span className="font-mono bg-secondary px-1">inventory</span>, <span className="font-mono bg-secondary px-1">available</span></li>
              </ul>
              <p className="mt-2 text-[10px]">Including <strong>product</strong> and <strong>stock</strong> columns activates Dashboard stats, Stock Alerts, and Doc Assistant context.</p>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD (Result State) */}
      {hasData && (
        <>
        {/* Data Source Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Analysis Based on Your CSV Data</p>
            <p className="text-blue-600 text-xs mt-1">
              All forecasts, rankings, and stock alerts are calculated from the data you uploaded — not from external market sources. 
              Top Performers = total sales per product. Stock Velocity = current stock ÷ avg daily sales. Market Trajectory = moving average + linear trend projection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ZONE 1: WINNERS & LOSERS (Top Left) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border rounded-xl p-5 shadow-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2 className="font-bold text-lg">Top Performers</h2>
                <div className="group/tip relative ml-auto">
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  <div className="absolute right-0 top-6 w-52 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border hidden group-hover/tip:block z-10">
                    Ranked by total sales volume from your CSV data. Top 3 highlighted in green (Pareto principle — top products driving most revenue).
                  </div>
                </div>
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
                <p className="text-sm text-muted-foreground">No product data available.</p>
              )}
              <p className="text-xs text-muted-foreground mt-4 italic">
                *Products with the highest margin contribution (pareto principle)
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
                    <div className="group/tip relative">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      <div className="absolute left-0 top-5 w-56 bg-gray-800 text-gray-200 text-xs p-2 rounded-md shadow-lg border border-gray-600 hidden group-hover/tip:block z-10">
                        Forecast projected from YOUR CSV data using moving average + linear trend analysis. Not real-time market data.
                      </div>
                    </div>
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
                <div className="flex items-center gap-3">
                  <div className="group/tip relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute right-0 top-6 w-60 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border hidden group-hover/tip:block z-10">
                      "Run Out in Xd" = current stock ÷ average daily sales from CSV. CRITICAL: stock below reorder point (avg × 3 × 1.5). WARNING: less than 7 days of stock left. SAFE: sufficient stock.
                    </div>
                  </div>
                  <button
                    onClick={() => setData({ hasData: false })}
                    className="text-sm font-medium hover:underline"
                  >
                    Reset Analysis
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockAlerts.length > 0 ? stockAlerts.map((item, i) => (
                  <div key={i} className="bg-white border p-4 rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm">{item.product}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Stock: {item.current_stock}</p>
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
        </>
      )}
    </div>
  );
}
