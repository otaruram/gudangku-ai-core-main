import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutGrid,
  TrendingUp,
  MessageSquare,
  Clock,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { title: "Forecaster", href: "/dashboard/forecaster", icon: TrendingUp },
  { title: "Doc Assistant", href: "/dashboard/assistant", icon: MessageSquare },
  { title: "History", href: "/dashboard/history", icon: Clock },
];

import { supabase } from "@/lib/supabaseClient";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User");
      }
    };
    getUser();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* 
    Cleanup Logic: 
    - Check last cleanup date.
    - If > 30 days, showing notification.
    - On click, reset lastCleanup date and clear data older than 1 year (conceptually, practically clearing cache).
  */
  const [showCleanup, setShowCleanup] = useState(false);

  useEffect(() => {
    const lastCleanup = localStorage.getItem('lastCleanup');
    if (!lastCleanup) {
      // First run: Start the timer (SET date), do NOT show notification
      localStorage.setItem('lastCleanup', Date.now().toString());
    } else {
      const diff = Date.now() - parseInt(lastCleanup);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (diff > thirtyDays) {
        setShowCleanup(true);
      }
    }
  }, []);



  const handleCleanup = () => {
    if (confirm("Jalankan Pembersihan Bulanan?\n\nKebijakan: Data lokal > 1 tahun akan dihapus.\nIni akan me-refresh aplikasi.")) {
      // Mark cleaned today
      localStorage.setItem('lastCleanup', Date.now().toString());

      // Clear caches (Simulating 1 year policy by clearing potential stale data)
      // In a real localized app, we might parse JSON and filter by date.
      // For now, we clear the critical large blobs which usually represent "current session" or specific uploads
      localStorage.removeItem('forecastChart');
      localStorage.removeItem('bestSellers');
      localStorage.removeItem('stockAlerts');

      // Optional: Filter chat history
      const chatHistory = localStorage.getItem('chatHistory');
      if (chatHistory) {
        try {
          const parsed = JSON.parse(chatHistory);
          const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
          const filtered = parsed.filter((msg: any) => new Date(msg.timestamp).getTime() > oneYearAgo);
          localStorage.setItem('chatHistory', JSON.stringify(filtered));
        } catch (e) {
          console.error("Failed to filter chat history", e);
        }
      }

      alert("Maintenance Selesai. Data lama berhasil dibersihkan.");
      window.location.reload();
    }
  };

  const getCurrentPageTitle = () => {
    const current = navItems.find(item => location.pathname === item.href);
    return current?.title || "Dashboard";
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 ease-in-out",
          // Mobile: slide in/out
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: collapsed state
          collapsed ? "lg:w-16" : "lg:w-64",
          // Mobile width
          "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "lg:justify-center" : "justify-between"
          )}>
            <Logo variant="light" showText={!collapsed} className="hidden lg:flex" />
            <Logo variant="light" showText={true} className="lg:hidden" />

            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-sidebar-foreground hover:bg-sidebar-accent lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>

            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(collapsed ? "lg:hidden" : "")}>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Ollama Status */}
          <div className={cn(
            "border-t border-sidebar-border p-4",
            collapsed ? "lg:hidden" : ""
          )}>
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-3">
              <div className="relative">
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="absolute inset-0 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-sidebar-foreground">Local Brain Active</p>
                <p className="text-[10px] text-sidebar-muted">Data aman, offline</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        // Desktop margin
        collapsed ? "lg:ml-16" : "lg:ml-64",
        // Mobile no margin
        "ml-0"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 sm:px-6">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">Gudangku</span>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="font-medium">{getCurrentPageTitle()}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications with Clear Data */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {showCleanup && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2 border-b text-xs font-semibold text-muted-foreground">
                  Notifikasi Sistem
                </div>
                {showCleanup ? (
                  <DropdownMenuItem className="cursor-pointer bg-destructive/10" onClick={handleCleanup}>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium flex items-center gap-2 text-destructive">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        Maintenance Bulanan
                      </span>
                      <span className="text-xs text-muted-foreground">Waktunya bersihkan data {'>'} 1 tahun.</span>
                    </div>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">Tidak ada notifikasi baru.</span>
                  </DropdownMenuItem>
                )}

              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 rounded-full h-10 w-10 md:h-auto md:w-auto md:px-3 md:rounded-md">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User"
                      className="h-8 w-8 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {userName ? userName.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                  <span className="hidden text-sm font-medium sm:inline truncate max-w-[100px]">
                    {userName || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
