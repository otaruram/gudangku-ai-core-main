import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Box, TrendingUp, MessageSquare, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Tentang
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/login">
                Coba Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fitur
              </a>
              <a
                href="#about"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tentang
              </a>
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login">Masuk</Link>
                </Button>
                <Button variant="hero" asChild className="w-full">
                  <Link to="/login">Coba Sekarang</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-14 sm:pt-16">
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />

        <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:px-6 sm:py-24">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 sm:mb-8 sm:px-4 sm:py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs font-medium text-muted-foreground">Powered by Local AI</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Prediksi Stok, Tanya Dokumen.{" "}
            <span className="text-gradient-emerald">Semua di Satu Tempat.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
            Dulu, gudang adalah tempat yang penuh dengan misteri. Kami membangun Gudangku
            untuk memberikan 'otak' pada gudang Anda. Bukan sekadar mencatat, tapi memprediksi masa depan.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex justify-center sm:mt-10">
            <Button variant="hero" size="lg" className="w-full sm:w-auto sm:px-8" asChild>
              <Link to="/login">
                Mulai Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto mt-12 max-w-5xl sm:mt-20">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60 sm:h-3 sm:w-3" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/60 sm:h-3 sm:w-3" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60 sm:h-3 sm:w-3" />
                </div>
                <div className="flex-1 text-center text-[10px] text-muted-foreground sm:text-xs">
                  app.gudangku.ai
                </div>
              </div>

              {/* Dashboard Preview Content */}
              <div className="flex h-48 bg-background sm:h-80">
                {/* Mini Sidebar - Hidden on very small screens */}
                <div className="hidden w-12 shrink-0 bg-foreground p-2 sm:block sm:w-16 sm:p-3">
                  <div className="mb-3 h-6 w-6 rounded bg-sidebar-accent sm:mb-4 sm:h-8 sm:w-8" />
                  <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-6 w-6 rounded sm:h-8 sm:w-8 ${i === 1 ? 'bg-accent' : 'bg-sidebar-accent'}`} />
                    ))}
                  </div>
                </div>

                {/* Preview Cards */}
                <div className="flex-1 p-3 sm:p-6">
                  <div className="grid gap-2 sm:gap-4 sm:grid-cols-3">
                    {[
                      { label: "Total Stok", value: "12,847", trend: "+5.2%" },
                      { label: "Akan Habis", value: "23", trend: "3 hari" },
                      { label: "Akurasi AI", value: "94.7%", trend: "+2.1%" },
                    ].map((card, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-2 shadow-sm sm:p-4">
                        <p className="text-[10px] text-muted-foreground sm:text-xs">{card.label}</p>
                        <p className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-2xl">{card.value}</p>
                        <p className="mt-0.5 text-[10px] text-accent sm:mt-1 sm:text-xs">{card.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 h-16 rounded-lg border border-border bg-secondary/30 sm:mt-4 sm:h-32" />
                </div>
              </div>
            </div>

            {/* Floating Elements - Hidden on mobile */}
            <div className="absolute -right-4 -top-4 hidden animate-float rounded-lg border border-accent/20 bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-accent" />
                <span className="text-xs font-medium">Prediksi aktif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-secondary/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              Fitur yang Membuat Gudang Anda <span className="text-gradient-emerald">Cerdas</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
              Teknologi AI lokal yang menjaga data Anda tetap aman
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                title: "Smart Forecaster",
                description: "Prediksi stok dengan AI Prophet. Tahu kapan barang habis sebelum terjadi.",
              },
              {
                icon: MessageSquare,
                title: "Doc Assistant",
                description: "Tanya jawab dokumen SOP dengan Ollama. Data tetap lokal, privasi terjaga.",
              },
              {
                icon: Box,
                title: "Real-time Tracking",
                description: "Monitor stok gudang secara real-time. Notifikasi instan untuk barang kritis.",
              },
              {
                icon: Shield,
                title: "Data Privacy",
                description: "Semua data diproses secara lokal. Tidak ada yang dikirim ke cloud.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-lg sm:p-6"
              >
                <div className="mb-3 inline-flex rounded-lg bg-accent/10 p-2 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground sm:mb-4 sm:p-3">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg">{feature.title}</h3>
                <p className="text-xs text-muted-foreground sm:text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
            Siap untuk Transformasi <span className="text-gradient-emerald">Gudang Anda</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Bergabung dengan ratusan perusahaan yang sudah menggunakan Gudangku untuk operasi supply chain mereka.
          </p>
          <Button variant="hero" size="lg" className="mt-6 w-full sm:mt-8 sm:w-auto sm:px-10" asChild>
            <Link to="/login">
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8 sm:py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground sm:text-sm">
            © 2024 Gudangku. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
