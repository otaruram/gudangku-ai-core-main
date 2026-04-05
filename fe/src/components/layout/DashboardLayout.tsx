import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
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
  Upload,
  Zap,
  Calendar,
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

const adminNavItem = { title: "Admin Panel", href: "/dashboard/admin", icon: Shield };

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/config";
import { OnboardingTour } from "@/components/features/OnboardingTour";
import { clearSensitiveSessionData, getSessionData, setSessionData } from "@/lib/sessionData";

const coreNavItems = [
  { title: "Upload CSV", href: "/dashboard/upload", icon: Upload },
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { title: "History", href: "/dashboard/history", icon: Clock },
];

const aiNavItems = [
  { title: "Forecaster", href: "/dashboard/forecaster", icon: TrendingUp },
  { title: "Event Simulator", href: "/dashboard/seasonal", icon: Calendar },
  { title: "Doc Assistant", href: "/dashboard/assistant", icon: MessageSquare },
];

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const inferredRole = String(
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    user?.user_metadata?.user_role ||
    "user"
  ).toLowerCase();
  const userEmail = String(user?.email || "").toLowerCase();
  const ownerEmails = new Set(["okitr52@gmail.com", "otaruram@gmail.com"]);
  const emailIsAdmin = ownerEmails.has(userEmail);

  // Get user data from auth context
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
  const authRole = String(user?.app_metadata?.role || user?.user_metadata?.role || "").toLowerCase();
  const userInitial = (userName || "U").trim().slice(0, 1).toUpperCase();

  // Handle logout
  const handleLogout = async () => {
    clearSensitiveSessionData();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
    } else {
      toast.success("Successfully logged out");
      navigate("/", { replace: true });
    }
  };

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
    - Monthly cleanup cycle (30 days)
    - Shows countdown in notification
    - Highlights notification when cleanup is due
  */
  const [showCleanup, setShowCleanup] = useState(false);
  const [daysUntilCleanup, setDaysUntilCleanup] = useState<number>(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [dailyQuota, setDailyQuota] = useState<number>(10);
  const [userRole, setUserRole] = useState<string>(inferredRole === "admin" || emailIsAdmin ? "admin" : "user");
  const [notificationsOn, setNotificationsOn] = useState(() => {
    return localStorage.getItem('notificationsOn') !== 'false';
  });
  const hasNewUpdates = notificationsOn;
  const isAdmin = userRole === "admin" || authRole === "admin" || emailIsAdmin;

  useEffect(() => {
    const calculateCleanupStatus = () => {
      const lastCleanup = localStorage.getItem('lastCleanup');
      const now = Date.now();

      if (!lastCleanup) {
        // First run: Start the timer
        localStorage.setItem('lastCleanup', now.toString());
        setDaysUntilCleanup(30);
        setShowCleanup(false);
      } else {
        const lastCleanupTime = parseInt(lastCleanup);
        const diffMs = now - lastCleanupTime;
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const daysLeft = 30 - diffDays;

        setDaysUntilCleanup(Math.max(0, daysLeft));
        setShowCleanup(diffDays >= 30);
      }
    };

    calculateCleanupStatus();

    // Update countdown every hour
    const interval = setInterval(calculateCleanupStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    if (inferredRole === "admin" || emailIsAdmin) {
      setUserRole("admin");
    }

    const fetchCredits = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.Authorization) return;
        const res = await fetch("/api/credits", { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setCredits(data.current_credits);
          setDailyQuota(data.daily_quota === "unlimited" ? Infinity : (data.daily_quota ?? 10));
          const apiRole = String(data.role ?? inferredRole ?? "user").toLowerCase();
          setUserRole(apiRole === "admin" || emailIsAdmin ? "admin" : apiRole);
        }
      } catch {
        /* ignore, credits display is non-critical */
      }
    };
    fetchCredits();
  }, [user, inferredRole, emailIsAdmin]);

  useEffect(() => {
    if (authRole === "admin" || emailIsAdmin) {
      setUserRole("admin");
    }
  }, [authRole, emailIsAdmin]);

  const handleCleanup = () => {
    if (confirm("Run Monthly Cleanup?\n\nPolicy: Local data older than 1 year will be deleted.\nThis will refresh the application.")) {
      // Mark cleaned today
      localStorage.setItem('lastCleanup', Date.now().toString());

      // Clear caches (Simulating 1 year policy by clearing potential stale data)
      // In a real localized app, we might parse JSON and filter by date.
      // For now, we clear the critical large blobs which usually represent "current session" or specific uploads
      localStorage.removeItem('forecastChart');
      localStorage.removeItem('bestSellers');
      localStorage.removeItem('stockAlerts');

      // Optional: Filter chat history
      const chatHistory = getSessionData('chatHistory');
      if (chatHistory) {
        try {
          const parsed = JSON.parse(chatHistory);
          const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
          const filtered = parsed.filter((msg: any) => new Date(msg.timestamp).getTime() > oneYearAgo);
          setSessionData('chatHistory', JSON.stringify(filtered));
        } catch (e) {
          console.error("Failed to filter chat history", e);
        }
      }

      alert("Maintenance Complete. Old data has been cleaned up.");
      window.location.reload();
    }
  };

  const getCurrentPageTitle = () => {
    const allNavItems = [...coreNavItems, ...aiNavItems];
    const current = allNavItems.find(item => location.pathname === item.href);
    return current?.title || "Dashboard";
  };

  const renderNavSection = (
    title: string,
    items: Array<{ title: string; href: string; icon: any }>
  ) => (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5",
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
    </div>
  );

  return (
    <div
      className="dark flex min-h-screen w-full"
      style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}
    >
      <OnboardingTour />
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
          <nav className="flex-1 space-y-2 p-3">
            {renderNavSection("Core", coreNavItems)}
            <div className="my-1 border-t border-sidebar-border/70" />
            {renderNavSection("AI Tools", aiNavItems)}
            {/* Admin nav — only visible to admins */}
            {isAdmin && (() => {
              const isActive = location.pathname === adminNavItem.href;
              return (
                <Link
                  to={adminNavItem.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-2 border-t border-sidebar-border pt-3",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <adminNavItem.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(collapsed ? "lg:hidden" : "")}>{adminNavItem.title}</span>
                </Link>
              );
            })()}
          </nav>

          {/* Notification Toggle in Sidebar */}
          <div className={cn(
            "border-t border-sidebar-border p-4",
            collapsed ? "lg:hidden" : ""
          )}>
            <div className="flex items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2.5 mb-2">
              <div className="flex items-center gap-2">
                <Bell className={cn("h-4 w-4 shrink-0", notificationsOn ? "text-accent" : "text-sidebar-muted")} />
                <span className="text-xs font-medium text-sidebar-foreground">Updates</span>
              </div>
              <button
                onClick={() => {
                  const next = !notificationsOn;
                  setNotificationsOn(next);
                  localStorage.setItem('notificationsOn', next.toString());
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                  notificationsOn ? "bg-accent" : "bg-sidebar-border"
                )}
                aria-label="Toggle notifications"
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                  notificationsOn ? "translate-x-4" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>

          {/* Notification Toggle collapsed icon */}
          <div className={cn(
            "border-t border-sidebar-border p-2 hidden lg:flex justify-center",
            collapsed ? "lg:flex" : "lg:hidden"
          )}>
            <button
              onClick={() => {
                const next = !notificationsOn;
                setNotificationsOn(next);
                localStorage.setItem('notificationsOn', next.toString());
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
              title={notificationsOn ? "Updates On" : "Updates Off"}
            >
              <Bell className={cn("h-4 w-4", notificationsOn ? "text-accent" : "text-sidebar-muted")} />
              {notificationsOn && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          </div>

          {/* AI Status */}
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
                <p className="text-xs font-medium text-sidebar-foreground">Gemini 2.5 Flash</p>
                <p className="text-[10px] text-sidebar-muted">Cloud AI • Online</p>
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
      )} style={{ backgroundColor: "var(--color-bg-primary)" }}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-4 backdrop-blur sm:h-16 sm:px-6" style={{ backgroundColor: "rgba(15, 17, 23, 0.88)", borderColor: "var(--color-border)" }}>
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
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{getCurrentPageTitle()}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {showCleanup && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                  {!showCleanup && notificationsOn && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <span className="text-xs font-semibold text-muted-foreground">Notifications</span>
                </div>
                {notificationsOn && (
                  <>
                    <DropdownMenuItem disabled className="opacity-100">
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium flex items-center gap-2 text-primary text-xs">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          v2.0 — Admin Panel & Smart Actions
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Admin user management, Ask AI from dashboard, Tokopedia order links, real deadstock analysis.
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="opacity-100">
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium flex items-center gap-2 text-primary text-xs">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          v1.5 — AI Upgrade
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Gemini 2.5 Flash integration, credit system, export audit, CSV context-aware answers.
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                {!notificationsOn && (
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">Updates are off. Toggle in the sidebar to enable.</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {showCleanup ? (
                  <DropdownMenuItem className="cursor-pointer bg-destructive/10" onClick={handleCleanup}>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium flex items-center gap-2 text-destructive text-xs">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        Monthly Maintenance Required
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Click to clean up old data.
                      </span>
                    </div>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      System clean • Next maintenance: {daysUntilCleanup}d
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Credits Badge */}
            {credits !== null && (
              <div
                title={userRole === "admin" ? "Admin — unlimited credits" : `${credits} / ${dailyQuota} daily credits remaining`}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold cursor-default select-none",
                  isAdmin
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : credits <= 2
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : credits <= 5
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-primary/30 bg-primary/10 text-primary"
                )}
              >
                <Zap className="h-3 w-3" />
                {isAdmin ? "∞" : `${credits} / ${dailyQuota}`}
              </div>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 rounded-full h-10 w-10 md:h-auto md:w-auto md:px-3 md:rounded-md">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User"
                      className="h-8 w-8 rounded-full border object-cover"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        color: "white",
                        background: "linear-gradient(135deg, #10b981, #06b6d4)",
                        boxShadow: "0 6px 16px rgba(6, 182, 212, 0.25)",
                      }}
                    >
                      {userInitial}
                    </div>
                  )}
                  <span className="hidden text-sm font-medium sm:inline truncate max-w-[110px]" style={{ color: "var(--color-text-primary)" }}>
                    {userName || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6" style={{ backgroundColor: "var(--color-bg-primary)", minHeight: "calc(100vh - 56px)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
