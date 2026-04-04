import { useState } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, ArrowRight } from "lucide-react";
import { UploadZone } from "@/components/features/forecast/UploadZone";
import { useForecast } from "@/context/ForecastContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

export default function UploadCSV() {
  const { data, setData } = useForecast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const hasData = data.hasData;
  const csvFileName = localStorage.getItem("csvFileName");

  const handleFileProcess = async (file: File) => {
    setLoading(true);
    setUploadSuccess(false);
    try {
      const csvText = await file.text();
      const csvLines = csvText.split("\n");
      const header = csvLines[0];
      const rowCount = csvLines.length - 1;
      const sampleRows = csvLines.slice(1, 6).join("\n");
      const csvSummary = `File: ${file.name}\nColumns: ${header}\nTotal rows: ${rowCount}\nSample data:\n${sampleRows}`;
      localStorage.setItem("csvContext", csvSummary);
      localStorage.setItem("csvFileName", file.name);

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
        let errMsg = "Upload failed";
        try {
          const errorData = await response.json();
          errMsg = errorData.error || errorData.detail || errMsg;
        } catch {
          /* ignore */
        }
        throw new Error(errMsg);
      }

      const responseData = await response.json();

      const mappedForecast = responseData.forecast_chart.map((item: any) => ({
        date: new Date(item.ds).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        value: Math.round(item.yhat),
      }));

      const best = Object.entries(responseData.best_sellers || {}).map(([name, qty]) => ({
        name,
        qty,
      }));

      setData({
        forecastChart: mappedForecast,
        bestSellers: best,
        stockAlerts: responseData.stock_alerts || [],
        hasData: true,
      });

      setUploadSuccess(true);
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Remove current data? You'll need to upload a new CSV to use all features.")) {
      setData({ forecastChart: [], bestSellers: [], stockAlerts: [], hasData: false });
      localStorage.removeItem("csvContext");
      localStorage.removeItem("csvFileName");
      setUploadSuccess(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload CSV</h1>
          <p className="text-muted-foreground mt-1">
            Upload your inventory data to activate all features
          </p>
        </div>
        {hasData && (
          <button
            onClick={handleReset}
            className="text-sm font-medium text-destructive hover:underline border border-destructive/20 rounded-md px-3 py-1 bg-destructive/5"
          >
            Change File / Reset
          </button>
        )}
      </div>

      {/* Success State */}
      {hasData && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Data Loaded Successfully</h2>
            <p className="text-muted-foreground mt-2">
              {csvFileName ? `File: ${csvFileName}` : "Your CSV data is active"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All features are now unlocked and ready to use.
            </p>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: "Dashboard", href: "/dashboard", desc: "View analytics" },
                { title: "Forecaster", href: "/dashboard/forecaster", desc: "Sales forecast" },
                { title: "Doc Assistant", href: "/dashboard/assistant", desc: "AI analysis" },
                { title: "History", href: "/dashboard/history", desc: "Past records" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="rounded-lg border bg-card p-4 text-left hover:bg-secondary/50 transition-colors group"
                >
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!hasData && (
        <div className="max-w-2xl mx-auto mt-4">
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <UploadZone
              isDragging={isDragging}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith(".csv")) {
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
                <p className="text-sm font-medium">Processing CSV Data...</p>
                <p className="text-xs text-muted-foreground">
                  Analyzing • Forecasting • Building Insights
                </p>
              </div>
            )}
          </div>

          {/* CSV Format Guide */}
          <div className="mt-8 p-4 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-foreground">Required CSV Format:</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={downloadSampleCSV}
              >
                <Download className="h-3 w-3" />
                Download Sample CSV
              </Button>
            </div>
            <p className="mb-2">Your CSV must have these columns (names are auto-detected):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Date</strong> (required):{" "}
                <span className="font-mono bg-secondary px-1">date</span>,{" "}
                <span className="font-mono bg-secondary px-1">tanggal</span>,{" "}
                <span className="font-mono bg-secondary px-1">ds</span>
              </li>
              <li>
                <strong>Sales/Quantity</strong> (required):{" "}
                <span className="font-mono bg-secondary px-1">sales</span>,{" "}
                <span className="font-mono bg-secondary px-1">qty</span>,{" "}
                <span className="font-mono bg-secondary px-1">quantity</span>,{" "}
                <span className="font-mono bg-secondary px-1">y</span>
              </li>
              <li>
                <strong>Product</strong> (recommended):{" "}
                <span className="font-mono bg-secondary px-1">product</span>,{" "}
                <span className="font-mono bg-secondary px-1">item</span>,{" "}
                <span className="font-mono bg-secondary px-1">name</span>,{" "}
                <span className="font-mono bg-secondary px-1">sku</span>
              </li>
              <li>
                <strong>Stock</strong> (recommended):{" "}
                <span className="font-mono bg-secondary px-1">stock</span>,{" "}
                <span className="font-mono bg-secondary px-1">inventory</span>,{" "}
                <span className="font-mono bg-secondary px-1">available</span>
              </li>
            </ul>
            <p className="mt-2 text-[10px]">
              Including <strong>product</strong> and <strong>stock</strong> columns activates
              Dashboard stats, Stock Alerts, and Doc Assistant context.
            </p>
          </div>

          {/* Feature Activation Info */}
          <div className="mt-6 rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">What gets activated after upload:</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Dashboard</p>
                  <p className="text-muted-foreground">Live monitoring, stock alerts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Forecaster</p>
                  <p className="text-muted-foreground">Sales prediction charts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Doc Assistant</p>
                  <p className="text-muted-foreground">AI-powered data analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1 shrink-0" />
                <div>
                  <p className="font-medium">History</p>
                  <p className="text-muted-foreground">Track forecast & chat records</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
