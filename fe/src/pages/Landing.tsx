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
      {/* Navigasi */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo />

<<<<<<< HEAD
          {/* Desktop Nav */}
=======
          {/* Navigasi Desktop */}
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tentang</a>
          </nav>

<<<<<<< HEAD
          {/* Desktop CTAs */}
=======
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/login">Coba Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

<<<<<<< HEAD
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
=======
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
<<<<<<< HEAD

        <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:px-6 sm:py-24">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 sm:mb-8 sm:px-4 sm:py-1.5">
=======
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs font-medium text-muted-foreground">Powered by Local AI (Ollama)</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Prediksi Stok, Tanya Dokumen. <br />
            <span className="text-gradient-emerald">Semua di Satu Tempat.</span>
          </h1>

<<<<<<< HEAD
          {/* Subheadline */}
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
            Dulu, gudang adalah tempat yang penuh dengan misteri. Kami membangun Gudangku
            untuk memberikan 'otak' pada gudang Anda. Bukan sekadar mencatat, tapi memprediksi masa depan.
=======
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Berikan 'otak' pada gudang Anda. Bukan sekadar mencatat, tapi memprediksi masa depan inventori Anda.
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
          </p>

          <div className="mt-10">
            <Button variant="hero" size="lg" className="px-10" asChild>
              <Link to="/login">Mulai Gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-20 rounded-xl border border-border bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto">
             <div className="bg-secondary/50 px-4 py-3 border-b border-border flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/50" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                <div className="h-3 w-3 rounded-full bg-green-500/50" />
             </div>
             <div className="h-64 md:h-96 bg-background p-6">
                <div className="animate-pulse space-y-4">
                   <div className="h-8 bg-secondary rounded w-1/4"></div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="h-32 bg-secondary rounded"></div>
                      <div className="h-32 bg-secondary rounded"></div>
                      <div className="h-32 bg-secondary rounded"></div>
                   </div>
                   <div className="h-32 bg-secondary/50 rounded"></div>
                </div>
<<<<<<< HEAD
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
=======
             </div>
>>>>>>> e055e240f630c2dc77919484fad22841885aafdd
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-secondary/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2025 Gudangku AI. Dikembangkan untuk efisiensi supply chain.</p>
        </div>
      </footer>
    </div>
  );
}
