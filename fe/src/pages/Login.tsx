import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error("Login Gagal: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Decorative (Hidden on mobile/tablet) */}
      <div className="hidden w-1/2 bg-foreground xl:block">
        <div className="flex h-full flex-col justify-between p-8 lg:p-12">
          <Logo variant="light" />

          <div className="max-w-md">
            <blockquote className="text-xl font-light leading-relaxed text-primary-foreground/90 lg:text-2xl">
              "Gudangku telah mengubah cara kami mengelola inventori. Prediksi AI-nya sangat akurat dan menghemat waktu kami hingga 40%."
            </blockquote>
            <div className="mt-4 lg:mt-6">
              <p className="font-medium text-primary-foreground">Ahmad Wijaya</p>
              <p className="text-sm text-primary-foreground/60">Supply Chain Manager, PT Logistik Nusantara</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs text-primary-foreground/60">Sistem aktif dan aman</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full items-center justify-center bg-secondary/30 px-4 py-8 sm:px-6 xl:w-1/2">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          {/* Logo for mobile/tablet */}
          <div className="mb-6 xl:hidden sm:mb-8">
            <Logo />
          </div>

          {/* Form Container */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <h1 className="text-xl font-bold sm:text-2xl">Selamat Datang</h1>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">
                Masuk dengan akun Google Anda
              </p>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full gap-3 px-4 py-2 text-black transition-all bg-white border border-black rounded-md hover:bg-emerald-50 hover:border-emerald-500 font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Masuk dengan Google
                </>
              )}
            </button>

            {/* Terms Notice */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Dengan masuk, Anda menyetujui{" "}
              <a href="#" className="underline hover:text-foreground">
                Syarat & Ketentuan
              </a>{" "}
              dan{" "}
              <a href="#" className="underline hover:text-foreground">
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
          </div>

          {/* Security Note */}
          <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6">
            Dilindungi dengan enkripsi end-to-end. Data Anda aman bersama kami.
          </p>
        </div>
      </div>
    </div>
  );
}
