import { Link } from "react-router-dom";
import { ArrowRight, Box, TrendingUp, MessageSquare, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigasi */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo />

          {/* Navigasi Desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tentang</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/login">Coba Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs font-medium text-muted-foreground">Powered by Local AI (Ollama)</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Prediksi Stok, Tanya Dokumen. <br />
            <span className="text-gradient-emerald">Semua di Satu Tempat.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Berikan 'otak' pada gudang Anda. Bukan sekadar mencatat, tapi memprediksi masa depan inventori Anda.
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
             </div>
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
