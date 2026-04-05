import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Upload, LayoutGrid, TrendingUp, MessageSquare,
  X, ArrowRight, ChevronRight, Sparkles, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "onboardingDone_v1";

const steps = [
  {
    icon: Sparkles,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Selamat datang di Gudangku! 👋",
    subtitle: "AI Warehouse Intelligence for UMKM Indonesia",
    description:
      "Gudangku membantu kamu kelola stok, prediksi penjualan 365 hari ke depan, dan simulasi kebutuhan stok saat event besar — semua dengan AI.",
    tip: null,
  },
  {
    icon: Upload,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    title: "Langkah 1: Upload Data CSV",
    subtitle: "Format: date, product, sales, stock",
    description:
      "Upload file CSV berisi data inventory kamu. Gudangku otomatis deteksi kolom — support berbagai format nama kolom (tanggal, qty, item, dll).",
    tip: "Ada sample CSV yang bisa kamu download jika belum punya data.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    title: "Langkah 2: Lihat Forecast & Dashboard",
    subtitle: "Prediksi otomatis 365 hari ke depan",
    description:
      "Setelah upload, Dashboard dan Forecaster langsung aktif — tampilkan top performers, deadstock, stock velocity, dan proyeksi penjualan berbasis data kamu.",
    tip: "Semua analisis dihitung dari CSV kamu, bukan data pasar eksternal.",
  },
  {
    icon: Calendar,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    title: "Fitur Unggulan: Event Simulator 🔥",
    subtitle: "Lebaran, Harbolnas, Natal & lainnya",
    description:
      "Pilih event mendatang, AI akan otomatis hitung produk mana yang akan kehabisan stok, kapan harus reorder, dan berapa yang harus dipesan — langsung dari dashboard.",
    tip: null,
  },
  {
    icon: MessageSquare,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10 border-pink-500/20",
    title: "Langkah 3: Tanya AI Apapun",
    subtitle: "Doc Assistant — AI yang tau data kamu",
    description:
      "Tanya Doc Assistant dengan bahasa bebas: \"Kapan Gula Pasir habis?\", \"Apa strategi clearance untuk deadstock?\", atau \"Generate pesan WhatsApp ke supplier Minyak Goreng.\"",
    tip: "AI memahami konteks CSV yang sudah kamu upload.",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so layout renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
      navigate("/dashboard/upload");
    }
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-6 pt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step
                  ? "w-6 bg-primary"
                  : i < step
                  ? "w-3 bg-primary/40"
                  : "w-3 bg-secondary"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-6">
          {/* Icon */}
          <div className={cn(
            "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border",
            current.iconBg
          )}>
            <Icon className={cn("h-7 w-7", current.iconColor)} />
          </div>

          {/* Text */}
          <h2 className="text-lg font-bold leading-snug">{current.title}</h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{current.subtitle}</p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{current.description}</p>

          {current.tip && (
            <div className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
              💡 {current.tip}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Lewati
            </button>
            <Button onClick={next} size="sm" className="gap-1.5">
              {isLast ? (
                <>
                  Mulai Upload CSV
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
