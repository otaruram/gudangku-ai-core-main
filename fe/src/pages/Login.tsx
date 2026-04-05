import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Make sure this URL is registered in Redirect URLs on Supabase Dashboard
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Login Failed: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Left Panel - Decorative (Hidden on mobile) */}
      <div className="hidden w-1/2 xl:block" style={{ backgroundColor: 'var(--color-dark-primary)', backgroundImage: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))' }}>
        <div className="flex h-full flex-col justify-between p-12">
          <Logo variant="light" />
          <div className="max-w-md">
            <blockquote className="text-2xl font-light leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              "Gudangku telah transform cara kami manage inventory. Prediksi AI nya sangat akurat dan hemat waktu."
            </blockquote>
            <div className="mt-6">
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Budi Wijaya</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pemilik Toko Beras Jaya</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-safe)', animation: 'pulse-glow 2s infinite' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sistem tersertifikasi & terenkripsi</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full items-center justify-center px-6 xl:w-1/2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ← Kembali ke Home
          </Link>

          <div className="rounded-xl border p-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-md)' }}>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">Selamat Datang</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Login untuk akses Command Center
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 text-black transition-all bg-white border-2 border-black rounded-lg font-medium"
              style={{ 
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Login dengan Google
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Dengan login, Anda setuju dengan <span className="cursor-pointer hover:underline">Terms & Conditions</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
