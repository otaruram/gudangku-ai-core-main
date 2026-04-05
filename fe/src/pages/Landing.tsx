import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Box, TrendingUp, MessageSquare, Shield, Menu, X, Zap, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fullCommand = "$ forecast --sku 'Beras Premium' --horizon 30 --alert-mode smart";
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTypedCommand(fullCommand.slice(0, i));
      if (i >= fullCommand.length) {
        clearInterval(timer);
      }
    }, 35);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
      <header className="fixed top-0 z-50 w-full border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15, 17, 23, 0.95)", backdropFilter: "blur(8px)" }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm transition-colors" style={{ color: "var(--color-text-muted)" }}>
              Features
            </a>
            <a href="#how-it-works" className="text-sm transition-colors" style={{ color: "var(--color-text-muted)" }}>
              How It Works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild className="border-0">
              <Link to="/login" style={{ color: "var(--color-text-secondary)" }}>Sign In</Link>
            </Button>
            <Button asChild style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
              <Link to="/login">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t md:hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
            <nav className="flex flex-col gap-2 px-4 py-4">
              <a
                href="#features"
                className="rounded-lg px-3 py-2 text-sm transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="rounded-lg px-3 py-2 text-sm transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button variant="outline" asChild className="mt-2 w-full border-0" style={{ backgroundColor: "var(--color-bg-hover)", color: "var(--color-text-primary)" }}>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full" style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
                  <Link to="/login">Start Free</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-14 sm:pt-16">
        <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:mb-8 sm:px-4 sm:py-1.5" style={{ borderColor: "var(--color-accent)", backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-safe)", animation: "pulse-glow 2s infinite" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Powered by Azure AI</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Inventory yang Pintar.{" "}
            <span style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Prediksi yang Akurat.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Gudangku menggunakan AI untuk memprediksi stok dan memberikan insights actionable.
            Tanya dokumen, analisis tren, dan terima briefing otomatis di Telegram.
          </p>

          <div
            className="mx-auto mt-6 w-full max-w-3xl rounded-xl border px-4 py-3 text-left font-mono text-xs sm:text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(6, 182, 212, 0.07)", color: "var(--color-text-secondary)" }}
          >
            <span>{typedCommand}</span>
            <span
              aria-hidden="true"
              className="ml-1 inline-block w-2"
              style={{ borderRight: "2px solid var(--color-info)", animation: "pulse-glow 0.9s infinite" }}
            />
          </div>

          <div className="mt-8 flex justify-center sm:mt-10">
            <Button size="lg" className="w-full border-0 sm:w-auto sm:px-8" style={{ backgroundColor: "var(--color-accent)", color: "white" }} asChild>
              <Link to="/login">
                Mulai Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="border-t py-16 sm:py-24" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              Fitur untuk <span style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Warehouse Pintar</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              Teknologi AI lokal yang menjaga data Anda tetap aman
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: TrendingUp, title: "Prediksi Cerdas", description: "Forecast stok dengan AI. Tahu kapan barang habis sebelum terjadi.", color: "var(--color-info)" },
              { icon: MessageSquare, title: "Asisten Dokumen", description: "Tanya SOP atau kebijakan dokumen dengan NLP. Data tetap lokal.", color: "var(--color-accent)" },
              { icon: Box, title: "Tracking Real-time", description: "Monitor stok real-time. Alert instant untuk item kritis.", color: "var(--color-critical)" },
              { icon: Shield, title: "Privasi Terjamin", description: "Semua diproses lokal. Tidak ada data yang keluar.", color: "var(--color-safe)" },
              { icon: Zap, title: "Rekomendasi Pesanan", description: "Hitung EOQ & ROP otomatis berdasarkan historical trend.", color: "var(--color-warning)" },
              { icon: BarChart3, title: "Analytics Mendalam", description: "Dashboard visual dengan insights produk terlaku & deadstock.", color: "var(--color-info)" },
              { icon: MessageSquare, title: "Telegram Integration", description: "Terima briefing otomatis & tanya stok via Telegram.", color: "var(--color-accent)" },
              { icon: Lock, title: "Keamanan Enterprise", description: "JWT auth, rate limiting, audit log ter-enkripsi.", color: "var(--color-safe)" },
            ].map((feature, i) => (
              <div key={i} className="group rounded-xl border p-4 transition-all sm:p-6 hover-lift" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}>
                <div className="mb-3 inline-flex rounded-lg p-2 sm:mb-4 sm:p-3" style={{ backgroundColor: `${feature.color}20`, color: feature.color }}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg" style={{ color: "var(--color-text-primary)" }}>{feature.title}</h3>
                <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-muted)" }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t py-16 sm:py-24" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-primary)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl" style={{ color: "var(--color-text-primary)" }}>
              How It <span style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Works</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              3 langkah sederhana untuk ubah data stok jadi keputusan yang actionable.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Upload CSV", desc: "Upload data penjualan dan stok. Sistem otomatis deteksi kolom penting tanpa setup ribet.", tone: "var(--color-info)" },
              { step: "02", title: "AI Forecast + Alert", desc: "Gudangku hitung prediksi demand dan status stok (critical, warning, safe) per produk.", tone: "var(--color-warning)" },
              { step: "03", title: "Act in Real Time", desc: "Pantau dashboard, konsultasi Doc Assistant, dan kirim aksi via Telegram dalam hitungan detik.", tone: "var(--color-safe)" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border p-5 sm:p-6 hover-lift" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}>
                <div className="mb-4 inline-flex rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${item.tone}20`, color: item.tone }}>
                  STEP {item.step}
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-24" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
            Siap untuk Transform <span style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Warehouse Anda?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:mt-6 sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Bergabung dengan ratusan UMKM yang sudah menggunakan Gudangku untuk supply chain mereka.
          </p>
          <Button size="lg" className="mt-6 w-full border-0 sm:mt-8 sm:w-auto sm:px-10" style={{ backgroundColor: "var(--color-accent)", color: "white" }} asChild>
            <Link to="/login">
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 sm:py-12" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-muted)" }}>
            © 2026 Gudangku. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
