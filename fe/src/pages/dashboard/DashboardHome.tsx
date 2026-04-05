import { useForecast } from "@/context/ForecastContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Copy, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "@/lib/config";
import { setSessionData } from "@/lib/sessionData";

// Simple card components
function StatCard_Simple({ label, value, icon, color, trend }: any) {
  return (
    <div
      className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-sm font-medium mb-1">
            {label}
          </p>
          <p style={{ color: color }} className="text-2xl font-bold">
            {value}
          </p>
          {trend && (
            <p style={{ color: "var(--color-text-muted)" }} className="text-xs mt-1">
              {trend}
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function AlertCard({ status, title, quantity, days, action, onAction }: any) {
  const normalizedStatus = String(status || "").toLowerCase();
  const isCritical = normalizedStatus === "critical" || normalizedStatus === "stockout";
  const bgColor = isCritical ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)";
  const borderColor = isCritical ? "var(--color-critical)" : "var(--color-warning)";
  const textColor = isCritical ? "var(--color-critical)" : "var(--color-warning)";

  return (
    <div
      className="rounded-lg border p-4 flex items-start justify-between"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div>
        <p style={{ color: "var(--color-text-primary)" }} className="font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: textColor }} />
          {title}
        </p>
        <p style={{ color: "var(--color-text-secondary)" }} className="text-sm">
          Stok: {quantity} unit • {days} hari tersisa
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 border-0 text-white"
        style={{ backgroundColor: textColor }}
        onClick={onAction}
      >
        {action}
      </Button>
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data } = useForecast();
  const { forecastChart, bestSellers, stockAlerts, hasData } = data;

  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgLinked, setTgLinked] = useState(false);
  const [tgCopied, setTgCopied] = useState(false);

  const normalizedAlerts = (stockAlerts || []).map((alert: any) => ({
    ...alert,
    normalizedStatus: String(alert?.status || "").toLowerCase(),
    productLabel: alert?.product_name || alert?.product || "Produk",
    daysLeft: alert?.days_until_stockout ?? alert?.days_left ?? 0,
  }));

  const normalizedForecastChart = (forecastChart || []).map((point: any) => ({
    ...point,
    pointValue: Number(point?.value ?? point?.forecast ?? point?.yhat ?? 0),
  }));

  const normalizedBestSellers = (bestSellers || []).map((product: any) => ({
    ...product,
    label: product?.product_name || product?.name || "Produk",
    soldUnits: Number(product?.total_sold_units ?? product?.qty ?? 0),
    soldValue: Number(product?.total_sold_value ?? 0),
  }));

  const totalStock = (stockAlerts || []).reduce((sum: number, alert: any) => {
    const qty = Number(alert?.current_stock ?? 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

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

  const handleAlertAction = (alert: any) => {
    const isCritical = alert.normalizedStatus === "critical" || alert.normalizedStatus === "stockout";
    const prompt = isCritical
      ? [
          `Produk: ${alert.productLabel}`,
          `Status: KRITIS`,
          `Stok saat ini: ${alert.current_stock} unit`,
          `Estimasi habis: ${alert.daysLeft} hari`,
          "",
          "Tolong buat rencana emergency restock:",
          "1. Estimasi jumlah order aman untuk 14 hari",
          "2. Opsi supplier cepat + prioritas",
          "3. Risiko kalau order ditunda",
        ].join("\n")
      : [
          `Produk: ${alert.productLabel}`,
          `Status: WARNING`,
          `Stok saat ini: ${alert.current_stock} unit`,
          `Estimasi habis: ${alert.daysLeft} hari`,
          "",
          "Bantu susun rencana order yang efisien:",
          "1. Kapan waktu order terbaik",
          "2. Jumlah order awal + buffer",
          "3. Strategi supaya tidak jadi deadstock",
        ].join("\n");

    setSessionData("assistant_prompt", prompt);
    navigate("/dashboard/assistant");
  };

  if (!hasData) {
    return (
      <div className="grid gap-6 pb-12">
        {/* Empty State */}
        <div
          className="rounded-xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: "var(--color-accent)", backgroundColor: `rgba(59, 130, 246, 0.05)` }}
        >
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Belum ada data
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Upload file CSV berisi data penjualan & stok untuk memulai
          </p>
          <Button
            onClick={() => navigate("/dashboard/upload")}
            className="mt-6 border-0"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            Upload CSV Sekarang
          </Button>
        </div>

        {/* Telegram Section */}
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
            🤖 Link ke Telegram Bot
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Dapatkan briefing otomatis & tanya stok via Telegram
          </p>
          <Button
            onClick={generateTelegramCode}
            disabled={tgLoading}
            className="mt-4 border-0"
            style={{ backgroundColor: "var(--color-info)", color: "white" }}
          >
            {tgLoading ? "Loading..." : "Generate Link Code"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(6, 182, 212, 0.08)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Command Center
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Ringkasan stok, alert prioritas, dan prediksi demand harian dalam satu layar.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard_Simple
          label="Total Stok"
          value={totalStock.toLocaleString()}
          icon="📦"
          color="var(--color-accent)"
        />
        <StatCard_Simple
          label="Produk Kritis"
          value={normalizedAlerts.filter((a: any) => a.normalizedStatus === "critical" || a.normalizedStatus === "stockout").length}
          icon="🔴"
          color="var(--color-critical)"
          trend="Need action"
        />
        <StatCard_Simple
          label="Produk Warning"
          value={normalizedAlerts.filter((a: any) => a.normalizedStatus === "warning").length}
          icon="🟡"
          color="var(--color-warning)"
          trend="Plan order"
        />
        <StatCard_Simple
          label="AI Akurasi"
          value="94.7%"
          icon="✨"
          color="var(--color-safe)"
          trend="+2.1%"
        />
      </div>

      {/* Stock Alerts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          ⚠️ Status Stok Kritis
        </h2>
        <div className="space-y-3">
          {normalizedAlerts.length === 0 ? (
            <div style={{ color: "var(--color-text-muted)" }} className="text-center py-6">
              Semua stok dalam kondisi aman ✅
            </div>
          ) : (
            normalizedAlerts.slice(0, 5).map((alert: any, i: number) => (
              <AlertCard
                key={i}
                status={alert.normalizedStatus}
                title={alert.productLabel}
                quantity={alert.current_stock}
                days={alert.daysLeft}
                action={alert.normalizedStatus === "critical" || alert.normalizedStatus === "stockout" ? "PESAN SEKARANG" : "Rencana Order"}
                onAction={() => handleAlertAction(alert)}
              />
            ))
          )}
        </div>
      </div>

      {/* Forecast Chart */}
      {normalizedForecastChart.length > 0 && (
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
            📈 Prediksi Demand 30 Hari
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={normalizedForecastChart}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bg-secondary)",
                  border: `1px solid var(--color-border)`,
                }}
              />
              <Area
                type="monotone"
                dataKey="pointValue"
                stroke="var(--color-info)"
                fillOpacity={1}
                fill="url(#colorForecast)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best Sellers */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          🏆 Produk Terlaku
        </h2>
        <div className="space-y-3">
          {normalizedBestSellers.slice(0, 5).map((product: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-hover)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                >
                  #{i + 1}
                </div>
                <div>
                  <p style={{ color: "var(--color-text-primary)" }} className="font-semibold">
                    {product.label}
                  </p>
                  <p style={{ color: "var(--color-text-secondary)" }} className="text-xs">
                    Terjual: {product.soldUnits} unit
                  </p>
                </div>
              </div>
              <p style={{ color: "var(--color-accent)" }} className="font-bold">
                Rp {product.soldValue.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Telegram Link Section */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          🤖 Link ke Telegram Bot
        </h3>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="border-0"
            style={{ backgroundColor: "var(--color-safe)", color: "white" }}
          >
            <a href="https://t.me/Kang_Supply_Bot" target="_blank" rel="noopener noreferrer">
              Tanya via Telegram
            </a>
          </Button>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Chat langsung untuk cek stok, forecast, dan rekomendasi restock.
          </span>
        </div>

        {tgLinked ? (
          <div style={{ color: "var(--color-safe)" }} className="p-4 rounded-lg bg-green-50 border border-green-200">
            ✅ Telegram bot sudah terhubung
          </div>
        ) : tgCode ? (
          <div className="space-y-3">
            <p style={{ color: "var(--color-text-secondary)" }}>
              Kirim ke @gudangku_bot di Telegram:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`/link ${tgCode}`}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}
              />
              <Button
                onClick={copyCode}
                size="sm"
                className="border-0"
                style={{ backgroundColor: tgCopied ? "var(--color-safe)" : "var(--color-accent)", color: "white" }}
              >
                {tgCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={generateTelegramCode}
            disabled={tgLoading}
            className="border-0 w-full"
            style={{ backgroundColor: "var(--color-info)", color: "white" }}
          >
            {tgLoading ? "Loading..." : "Generate Link Code"}
          </Button>
        )}
      </div>
    </div>
  );
}
