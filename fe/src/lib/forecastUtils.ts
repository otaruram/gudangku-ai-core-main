export interface ForecastChartPoint {
  date: string;
  value: number;
}

export interface BestSellerPoint {
  name: string;
  qty: number;
}

export interface ForecastApiPayload {
  forecast_chart?: Array<{ ds: string; yhat: number }>;
  best_sellers?: Record<string, number>;
  stock_alerts?: any[];
}

export function buildCsvSummary(fileName: string, csvText: string): string {
  const csvLines = csvText.split("\n");
  const header = csvLines[0] ?? "";
  const rowCount = Math.max(0, csvLines.length - 1);
  const sampleRows = csvLines.slice(1, 6).join("\n");

  return `File: ${fileName}\nColumns: ${header}\nTotal rows: ${rowCount}\nSample data:\n${sampleRows}`;
}

export function mapForecastPayload(responseData: ForecastApiPayload): {
  forecastChart: ForecastChartPoint[];
  bestSellers: BestSellerPoint[];
  stockAlerts: any[];
} {
  const forecastChart = (responseData.forecast_chart ?? []).map((item) => ({
    date: new Date(item.ds).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    value: Math.round(item.yhat),
  }));

  const bestSellers = Object.entries(responseData.best_sellers ?? {}).map(([name, qty]) => ({
    name,
    qty,
  }));

  return {
    forecastChart,
    bestSellers,
    stockAlerts: responseData.stock_alerts ?? [],
  };
}
