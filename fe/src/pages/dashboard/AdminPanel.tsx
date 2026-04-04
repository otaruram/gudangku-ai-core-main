import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  Ban,
  BarChart3,
  Trash2,
  CreditCard,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/config";
import { cn } from "@/lib/utils";

interface PlatformStats {
  total_users: number;
  active_today: number;
  total_chats: number;
  total_forecasts: number;
  banned_users: number;
}

interface UserItem {
  id: string;
  email: string;
  current_credits: number;
  last_refresh_date: string;
  role: string;
  banned: boolean;
  total_chats: number;
  total_forecasts: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setError("Access denied — admin only.");
        setLoading(false);
        return;
      }

      if (!statsRes.ok || !usersRes.ok) throw new Error("Failed to fetch admin data");

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setUsers(usersData.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBan = async (userId: string, ban: boolean) => {
    if (!confirm(`${ban ? "Ban" : "Unban"} this user?`)) return;
    setActionLoading(userId);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ banned: ban }),
      });
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetCredits = async (userId: string) => {
    const input = prompt("Set credits to:", "10");
    if (input === null) return;
    const credits = parseInt(input, 10);
    if (isNaN(credits) || credits < 0) return alert("Invalid number");
    setActionLoading(userId);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/admin/users/${userId}/credits`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" /> Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, credits, and platform activity
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500" },
            { label: "Active Today", value: stats.active_today, icon: UserCheck, color: "text-emerald-500" },
            { label: "Banned", value: stats.banned_users, icon: UserX, color: "text-red-500" },
            { label: "Total Chats", value: stats.total_chats, icon: BarChart3, color: "text-purple-500" },
            { label: "Total Forecasts", value: stats.total_forecasts, icon: BarChart3, color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <s.icon className={cn("h-4 w-4", s.color)} />
                {s.label}
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" /> All Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-center p-3 font-medium">Role</th>
                <th className="text-center p-3 font-medium">Credits</th>
                <th className="text-center p-3 font-medium">Chats</th>
                <th className="text-center p-3 font-medium">Forecasts</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Last Active</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b hover:bg-muted/30 transition-colors",
                    u.banned && "bg-red-500/5"
                  )}
                >
                  <td className="p-3 font-medium truncate max-w-[200px]">{u.email}</td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono">
                    {u.role === "admin" ? "∞" : u.current_credits}
                  </td>
                  <td className="p-3 text-center">{u.total_chats}</td>
                  <td className="p-3 text-center">{u.total_forecasts}</td>
                  <td className="p-3 text-center">
                    {u.banned ? (
                      <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                        Banned
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-muted-foreground text-xs">{u.last_refresh_date}</td>
                  <td className="p-3 text-center">
                    {u.role !== "admin" && (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={u.banned ? "Unban user" : "Ban user"}
                          disabled={actionLoading === u.id}
                          onClick={() => handleBan(u.id, !u.banned)}
                        >
                          <Ban className={cn("h-3.5 w-3.5", u.banned ? "text-emerald-500" : "text-red-500")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Set credits"
                          disabled={actionLoading === u.id}
                          onClick={() => handleSetCredits(u.id)}
                        >
                          <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Delete user"
                          disabled={actionLoading === u.id}
                          onClick={() => handleDelete(u.id, u.email)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
