import { useState } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { UploadZone } from "@/components/features/forecast/UploadZone";
import { useForecast } from "@/context/ForecastContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSessionData, removeSessionData, setSessionData } from "@/lib/sessionData";
import { buildCsvSummary, mapForecastPayload } from "@/lib/forecastUtils";

const SAMPLE_CSV = `date,product,sales,stock
2025-01-01,Gula Pasir 1kg,45,200
2025-01-01,Minyak Goreng 2L,38,180
2025-01-01,Beras Premium 5kg,52,300
2025-01-01,Susu UHT 1L,15,200
2025-01-01,Tepung Terigu 1kg,12,180
2025-01-02,Gula Pasir 1kg,50,155
2025-01-02,Minyak Goreng 2L,42,142
2025-01-02,Beras Premium 5kg,48,252
2025-01-02,Susu UHT 1L,18,185
2025-01-02,Tepung Terigu 1kg,10,170
2025-01-03,Gula Pasir 1kg,55,100
2025-01-03,Minyak Goreng 2L,35,107
2025-01-03,Beras Premium 5kg,60,192
2025-01-03,Susu UHT 1L,20,165
2025-01-03,Tepung Terigu 1kg,14,156
2025-01-04,Gula Pasir 1kg,48,52
2025-01-04,Minyak Goreng 2L,40,67
2025-01-04,Beras Premium 5kg,55,137
2025-01-04,Susu UHT 1L,12,153
2025-01-04,Tepung Terigu 1kg,8,148
2025-01-05,Gula Pasir 1kg,52,500
2025-01-05,Minyak Goreng 2L,45,300
2025-01-05,Beras Premium 5kg,58,400
2025-01-05,Susu UHT 1L,22,200
2025-01-05,Tepung Terigu 1kg,15,180
2025-01-06,Gula Pasir 1kg,47,453
2025-01-06,Minyak Goreng 2L,36,264
2025-01-06,Beras Premium 5kg,50,350
2025-01-06,Susu UHT 1L,16,184
2025-01-06,Tepung Terigu 1kg,11,169
2025-01-07,Gula Pasir 1kg,58,395
2025-01-07,Minyak Goreng 2L,44,220
2025-01-07,Beras Premium 5kg,62,288
2025-01-07,Susu UHT 1L,19,165
2025-01-07,Tepung Terigu 1kg,13,156`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_inventory.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default function UploadCSV() {
  const { data, setData } = useForecast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasData = data.hasData;
  const csvFileName = getSessionData("csvFileName");

  const useSampleData = () => {
    const file = new File([SAMPLE_CSV], "sample_inventory.csv", { type: "text/csv" });
    handleFileProcess(file);
  };

  const handleFileProcess = async (file: File) => {
    setLoading(true);
    setUploadSuccess(false);
    setUploadError(null);
    try {
      const csvText = await file.text();
      const csvSummary = buildCsvSummary(file.name, csvText);
      setSessionData("csvContext", csvSummary);
      setSessionData("csvFileName", file.name);

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
        let errDetail = "";
        try {
          const errorData = await response.json();
          errMsg = errorData.error || errorData.detail || errMsg;
          errDetail = errorData.detail || "";
        } catch {
          /* ignore */
        }
        if (response.status === 401) {
          throw new Error(
            `AUTH_FAIL:${errDetail || errMsg}`
          );
        }
        throw new Error(errMsg);
      }

      const responseData = await response.json();
      const parsed = mapForecastPayload(responseData);

      setData({
        forecastChart: parsed.forecastChart,
        bestSellers: parsed.bestSellers,
        stockAlerts: parsed.stockAlerts,
        hasData: true,
      });

      setUploadSuccess(true);
    } catch (error: any) {
      console.error("Upload Error:", error);
      const msg: string = error.message || "";
      if (msg.startsWith("AUTH_FAIL:")) {
        const detail = msg.replace("AUTH_FAIL:", "");
        setUploadError(
          `Authentication failed (${detail}). Your session may have expired — please log out and log back in. If the issue persists, the server JWT secret may need to be updated in Azure Portal.`
        );
      } else {
        setUploadError(msg || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Remove current data? You'll need to upload a new CSV to use all features.")) {
      setData({ forecastChart: [], bestSellers: [], stockAlerts: [], hasData: false });
      removeSessionData("csvContext");
      removeSessionData("csvFileName");
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Error Banner */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive text-sm">Upload Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-destructive/60 hover:text-destructive text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Upload CSV</h1>
          <p className="text-muted-foreground mt-1">
            Upload your inventory data to activate all features
          </p>
        </div>
        {hasData && (
          <button
            onClick={handleReset}
            className="self-start text-sm font-medium text-destructive hover:underline border border-destructive/20 rounded-md px-3 py-1 bg-destructive/5 sm:self-auto"
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <p className="font-semibold text-foreground">Required CSV Format:</p>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={useSampleData}
                  disabled={loading}
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  Pakai Data Contoh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={downloadSampleCSV}
                >
                  <Download className="h-3 w-3" />
                  Download CSV
                </Button>
              </div>
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
