import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Pastikan URL ini sudah terdaftar di Redirect URLs Supabase Dashboard
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Login Gagal: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Kiri - Dekoratif (Hidden on mobile) */}
      <div className="hidden w-1/2 bg-foreground xl:block">
        <div className="flex h-full flex-col justify-between p-12">
          <Logo variant="light" />
          <div className="max-w-md">
            <blockquote className="text-2xl font-light leading-relaxed text-primary-foreground/90">
              "Gudangku telah mengubah cara kami mengelola inventori. Prediksi AI-nya sangat akurat."
            </blockquote>
            <div className="mt-6">
              <p className="font-medium text-primary-foreground">Ahmad Wijaya</p>
              <p className="text-sm text-primary-foreground/60">Supply Chain Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs text-primary-foreground/60">Sistem terenkripsi aman</span>
          </div>
        </div>
      </div>

      {/* Panel Kanan - Form Login */}
      <div className="flex w-full items-center justify-center bg-secondary/30 px-6 xl:w-1/2">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">Selamat Datang</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Masuk untuk mengakses Command Center Anda
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 text-black transition-all bg-white border border-black rounded-lg hover:bg-emerald-50 hover:border-emerald-500 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Masuk dengan Google
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Dengan masuk, Anda menyetujui <span className="underline cursor-pointer">Syarat & Ketentuan</span> kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
