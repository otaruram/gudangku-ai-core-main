import { useForecast } from "@/context/ForecastContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, 
  ArrowRight, Zap, Package, Calendar, Upload 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data } = useForecast();
  const { forecastChart, bestSellers, stockAlerts, hasData } = data;

  const winners = bestSellers.slice(0, 3);
  const deadstockPlaceholder = [
    { name: "Binder Clips (Old)", stock: 850, days_dormant: 90 },
    { name: "CD-R Spindle", stock: 120, days_dormant: 120 },
  ];

  const criticalActions = stockAlerts.filter((a: any) => a.status === "CRITICAL");
  const warningActions = stockAlerts.filter((a: any) => a.status === "WARNING");
  const allActions = [...criticalActions, ...warningActions];

  const handleRestock = (productName: string) => {
    alert(`Initiating Automated Restock for: ${productName}. Draft email created.`);
  };

  const csvFileName = localStorage.getItem('csvFileName');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `System active. Monitoring 24/7.${csvFileName ? ` Data: ${csvFileName}` : ''}`
              : "Upload a CSV file to activate all features."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {hasData ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              LIVE MONITORING
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-medium border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              AWAITING DATA
            </div>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed p-8 sm:p-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Operational Data</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Upload a CSV file in the Forecaster to activate the Dashboard, Doc Assistant, History, and Stock Alerts.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>CSV format: <span className="font-mono bg-secondary px-1">date, product, sales, stock</span></p>
          </div>
          <Button 
            className="mt-6" 
            onClick={() => navigate('/dashboard/forecaster')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV in Forecaster
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ... Winner Card ... */}

            {/* Deadstock Card */}
            <div className="rounded-xl border bg-card p-6 shadow-sm relative group">
              <h3 className="font-semibold text-lg mb-4">Deadstock / Losers</h3>
              <div className="space-y-4">
                {deadstockPlaceholder.map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b border-border/50">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="font-bold">{item.stock}</p>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    const prompt = `Need a clearance strategy for: ${deadstockPlaceholder.map(i => i.name).join(', ')}`;
                    localStorage.setItem('assistant_prompt', prompt);
                    navigate('/dashboard/assistant'); // FIX: Use navigate
                  }}
                >
                  Create Clearance Strategy
                </Button>
              </div>
            </div>
            
            {/* ... Warehouse Status Card ... */}
          </div>

          {/* ... Strategic Projection 2026 ... */}

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 bg-secondary/30 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">Action List</h2>
            </div>
            <div className="divide-y divide-border">
              {allActions.map((alert: any, i: number) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row justify-between items-center">
                  <p className="font-bold">{alert.product}</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/dashboard/assistant')} // FIX: Use navigate
                    >
                      Check Contract
                    </Button>
                    <Button onClick={() => handleRestock(alert.product)}>Order Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
