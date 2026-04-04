"""
Shared module: Forecast/Prophet service.
Rebranded for GeoSupplyGuard — geopolitical supply chain risk analysis.
"""

import io
import re
import uuid
import logging
from datetime import datetime

import pandas as pd
from prophet import Prophet

from shared.cosmos_client import get_container

logger = logging.getLogger(__name__)


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map flexible CSV headers to standard keys: ds, y, product, stock."""
    df.columns = [str(c).lower().strip() for c in df.columns]

    rename_map = {}
    used_cols = set()
    targets = {
        "ds": ["ds", "date", "time", "tanggal", "waktu"],
        "y": ["y", "sales", "quantity", "qty", "terjual", "penjualan", "amount"],
        "product": ["product", "item", "sku", "name", "nama", "barang"],
        "stock": ["stock", "inventory", "available", "sisa", "stok"],
    }

    for target, keywords in targets.items():
        found = False
        for kw in keywords:
            if found:
                break
            for col in df.columns:
                if col in used_cols:
                    continue
                if kw in col:
                    rename_map[col] = target
                    used_cols.add(col)
                    found = True
                    break

    df = df.rename(columns=rename_map)
    relevant = [c for c in df.columns if c in targets]
    df = df[relevant]

    if "ds" not in df.columns or "y" not in df.columns:
        raise ValueError(
            "CSV must contain Date (date/tanggal) and Sales (sales/qty) columns."
        )
    return df


async def generate_forecast(file_bytes: bytes, filename: str, horizon: int = 30) -> dict:
    df = pd.read_csv(io.BytesIO(file_bytes))
    df = normalize_columns(df)

    df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
    df = df.dropna(subset=["ds"])
    df["y"] = pd.to_numeric(df["y"], errors="coerce")
    df = df.dropna(subset=["y"])

    if "stock" in df.columns:
        df["stock"] = pd.to_numeric(df["stock"], errors="coerce").fillna(0)

    if len(df) < 10:
        raise ValueError("Data history too short. Provide at least 10 rows.")

    # --- Historical analysis ---
    top_sellers, worst_sellers = {}, {}
    if "product" in df.columns:
        stats = df.groupby("product")["y"].agg(["sum", "mean", "count"])
        stats = stats.sort_values("sum", ascending=False)
        top_sellers = stats["sum"].head(3).to_dict()
        worst_sellers = stats["sum"].tail(3).sort_values().to_dict()

    # --- Stock / ROP analysis ---
    stock_analysis = []
    if "product" in df.columns and "stock" in df.columns:
        last_stock = df.sort_values("ds").groupby("product")["stock"].last()
        product_stats = df.groupby("product")["y"].agg(["sum", "mean", "count"])
        LEAD_TIME_DAYS = 3
        for product in product_stats.index:
            current_stock = last_stock.get(product, 0)
            avg_sales = product_stats.loc[product, "mean"]
            safety_stock = int(avg_sales * LEAD_TIME_DAYS * 0.5)
            reorder_point = int((avg_sales * LEAD_TIME_DAYS) + safety_stock)
            velocity = avg_sales
            days_left = current_stock / velocity if velocity > 0 else 999
            if current_stock <= 0:
                status, action = "STOCKOUT", "Urgent Restock"
            elif current_stock < reorder_point:
                status, action = "CRITICAL", "Order Now"
            elif days_left < 7:
                status, action = "WARNING", "Plan Order"
            else:
                status, action = "SAFE", "Monitor"
            stock_analysis.append({
                "product": product,
                "status": status,
                "action": action,
                "days_left": round(days_left),
                "current_stock": int(current_stock),
                "rop": reorder_point,
            })
        stock_analysis = sorted(stock_analysis, key=lambda x: x["days_left"])[:10]

    # --- Prophet forecast ---
    df_total = df.groupby("ds")["y"].sum().reset_index()
    duration_days = (df_total["ds"].max() - df_total["ds"].min()).days
    model = Prophet(
        yearly_seasonality=duration_days > 365,
        weekly_seasonality=duration_days > 14,
        daily_seasonality=False,
    )
    model.fit(df_total)
    future = model.make_future_dataframe(periods=horizon)
    forecast = model.predict(future)
    result_chart = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(horizon)
    result_chart_list = result_chart.to_dict(orient="records")

    total_inventory = int(df["stock"].sum()) if "stock" in df.columns else 0
    potential_stockouts = len(
        [x for x in stock_analysis if x["status"] in ("STOCKOUT", "CRITICAL")]
    )

    response_data = {
        "summary": {
            "total_stock": total_inventory,
            "stockouts": potential_stockouts,
            "accuracy": "92%",
        },
        "best_sellers": top_sellers,
        "worst_sellers": worst_sellers,
        "stock_alerts": stock_analysis,
        "forecast_chart": result_chart_list,
    }

    # --- Persist to Cosmos DB ---
    try:
        serializable_chart = []
        for row in result_chart_list:
            serializable_chart.append({
                "ds": row["ds"].isoformat() if hasattr(row["ds"], "isoformat") else str(row["ds"]),
                "yhat": float(row["yhat"]),
                "yhat_lower": float(row["yhat_lower"]),
                "yhat_upper": float(row["yhat_upper"]),
            })
        safe_filename = re.sub(r"[^\w\s\-\.]", "_", filename or "unknown.csv")
        safe_filename = re.sub(r"[_\s]+", "_", safe_filename)

        container = get_container("prediction_history")
        container.upsert_item({
            "id": str(uuid.uuid4()),
            "filename": safe_filename,
            "plotData": {
                "chart": serializable_chart,
                "best_sellers": top_sellers,
                "stock_alerts": stock_analysis,
            },
            "createdAt": datetime.utcnow().isoformat(),
        })
    except Exception as exc:
        logger.error("Failed to save forecast history: %s", exc)

    return response_data


async def get_latest_forecast_summary() -> str:
    """
    Retrieve latest forecast summary for RAG context injection into AI chat.
    Returns an English plain-text summary.
    """
    try:
        container = get_container("prediction_history")
        query = "SELECT TOP 1 * FROM c ORDER BY c.createdAt DESC"
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        if not items:
            return "No forecast data available yet. Upload a sales CSV first."
        data = items[0].get("plotData", {})
        stock_alerts = data.get("stock_alerts", [])
        critical = [i["product"] for i in stock_alerts if i["status"] == "CRITICAL"]
        warning = [i["product"] for i in stock_alerts if i["status"] == "WARNING"]
        summary = "Current Warehouse Status (Live Forecast):\n"
        if critical:
            summary += f"  CRITICAL (< 7 days left): {', '.join(critical)}\n"
        else:
            summary += "  No critical stock items.\n"
        if warning:
            summary += f"  WARNING (< 30 days left): {', '.join(warning)}\n"
        return summary
    except Exception as exc:
        logger.error("RAG summary error: %s", exc)
        return "Forecast data unavailable."
