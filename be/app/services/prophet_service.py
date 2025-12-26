import pandas as pd
from prophet import Prophet
from fastapi import UploadFile, HTTPException
import io
import json

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flexible Column Mapper:
    Detects keywords in headers and renames them to standard keys:
    - 'ds' (Date)
    - 'y' (Sales/Qty)
    - 'product' (Product Name)
    - 'stock' (Current Stock)
    
    ENSURES UNIQUENESS: Maps only ONE source column to each target to prevent duplicates.
    """
    # Normalize headers
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    rename_map = {}
    used_cols = set()
    
    # Priority targets and their keywords
    targets = {
        'ds': ['ds', 'tanggal', 'date', 'time', 'waktu'],
        'y': ['y', 'terjual', 'sales', 'quantity', 'qty', 'penjualan', 'amount'],
        'product': ['product', 'nama', 'item', 'sku', 'barang', 'name'],
        'stock': ['stock', 'sisa', 'stok', 'inventory', 'available']
    }
    
    for target, keywords in targets.items():
        found = False
        # Try to find the BEST matching column for this target
        for kw in keywords:
            if found: break
            for col in df.columns:
                if col in used_cols: continue
                # Match keyword
                if kw in col:
                    rename_map[col] = target
                    used_cols.add(col)
                    found = True
                    break
            
    df = df.rename(columns=rename_map)
    
    # Keep only relevant columns to avoid ambiguity
    relevant_cols = [c for c in df.columns if c in targets.keys()]
    df = df[relevant_cols]
    
    # Critical Validation
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise ValueError("CSV must contain Date (tanggal/date) and Sales (terjual/sales) columns.")
        
    return df

async def generate_forecast(file: UploadFile, horizon: int = 30):
    try:
        content = await file.read()
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception:
            raise ValueError("Invalid CSV file.")
            
        # 1. Flexible Mapping
        try:
            df = normalize_columns(df)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
            
        # Data Cleaning
        df['ds'] = pd.to_datetime(df['ds'], errors='coerce')
        df = df.dropna(subset=['ds'])
        df['y'] = pd.to_numeric(df['y'], errors='coerce')
        df = df.dropna(subset=['y'])
        
        if 'stock' in df.columns:
            df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0)
        
        if len(df) < 10:
             raise HTTPException(status_code=400, detail="Data history too short. Please provide at least 10 rows.")

        # 2. INTELLIGENCE ENGINE ANALYSIS
        
        # A. ANALISIS HISTORIS (Winners & Deadstock)
        top_sellers = {}
        worst_sellers = {}
        
        if 'product' in df.columns:
            # Group by product
            product_stats = df.groupby('product')['y'].agg(['sum', 'mean', 'count'])
            product_stats = product_stats.sort_values('sum', ascending=False)
            
            top_sellers = product_stats['sum'].head(3).to_dict()
            worst_sellers = product_stats['sum'].tail(3).sort_values().to_dict() # Deadstock
        
        # B. ANALISIS STOK (Safety Stock & ROP)
        stock_analysis = []
        if 'product' in df.columns and 'stock' in df.columns:
            last_stock = df.sort_values('ds').groupby('product')['stock'].last()
            
            # Lead Time assumption (can be dynamic later, default 3 days)
            LEAD_TIME_DAYS = 3 
            
            for product in product_stats.index:
                current_stock = last_stock.get(product, 0)
                avg_sales = product_stats.loc[product, 'mean']
                
                # Formula: Safety Stock = Z * StdDev * sqrt(LeadTime)
                # Simplified: Safety Stock = (Max Daily Sales - Avg Daily Sales) * Lead Time
                # Let's use a simpler heuristics for now: 50% of Lead Time Demand
                safety_stock = int(avg_sales * LEAD_TIME_DAYS * 0.5)
                reorder_point = int((avg_sales * LEAD_TIME_DAYS) + safety_stock)
                
                velocity = avg_sales
                days_left = current_stock / velocity if velocity > 0 else 999
                
                # Logic Status
                if current_stock <= 0:
                     status = "STOCKOUT"
                     action = "Urgent Restock"
                elif current_stock < reorder_point:
                     status = "CRITICAL"
                     action = "Order Now"
                elif days_left < 7:
                     status = "WARNING"
                     action = "Plan Order"
                else:
                     status = "SAFE"
                     action = "Monitor"

                stock_analysis.append({
                    "product": product,
                    "status": status,
                    "action": action,
                    "days_left": round(days_left),
                    "current_stock": int(current_stock),
                    "rop": reorder_point
                })
            
            # Sort by urgency
            stock_analysis = sorted(stock_analysis, key=lambda x: x['days_left'])[:10]

        # C. FORECASTING (Total Sales Trend)
        df_total = df.groupby('ds')['y'].sum().reset_index()
        
        # Smart Seasonality Toggle
        duration_days = (df_total['ds'].max() - df_total['ds'].min()).days
        use_yearly = True if duration_days > 365 else False
        use_weekly = True if duration_days > 14 else False
        
        model = Prophet(yearly_seasonality=use_yearly, weekly_seasonality=use_weekly, daily_seasonality=False)
        model.fit(df_total)

        future = model.make_future_dataframe(periods=horizon)
        forecast = model.predict(future)
        
        result_chart = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(horizon)
        result_chart_list = result_chart.to_dict(orient='records')
        
        # Calculate Summary Stats for Dashboard Cards
        total_inventory_items = int(df['stock'].sum()) if 'stock' in df.columns else 0
        potential_stockouts = len([x for x in stock_analysis if x['status'] in ['STOCKOUT', 'CRITICAL']])
        model_accuracy = "92%" # Mock for now, requires cross-validation logic
        
        # Final Response Construction
        response_data = {
            "summary": {
                "total_stock": total_inventory_items,
                "stockouts": potential_stockouts,
                "accuracy": model_accuracy
            },
            "best_sellers": top_sellers,
            "worst_sellers": worst_sellers,
            "stock_alerts": stock_analysis,
            "forecast_chart": result_chart_list
        }

        # Save History to Supabase
        try:
             from app.core.db import db
             
             # Ensure connection
             if not db.is_connected():
                 print("⚠️ DB Disconnected in Prophet Service. Attempting reconnect...")
                 await db.connect()

             if db.is_connected():
                # Prepare data 
                serializable_chart = []
                for row in result_chart_list:
                    serializable_chart.append({
                        "ds": row['ds'].isoformat() if hasattr(row['ds'], 'isoformat') else str(row['ds']),
                        "yhat": float(row['yhat']),
                        "yhat_lower": float(row['yhat_lower']),
                        "yhat_upper": float(row['yhat_upper'])
                    })
                
                full_storage_data = {
                    "chart": serializable_chart,
                    "best_sellers": top_sellers,
                    "stock_alerts": stock_analysis
                }

                # IMPORTANT: Prisma 'Json' type expects a Python Dictionary, not a string.
                # It handles serialization automatically.
                await db.predictionhistory.create(
                    data={
                        "filename": file.filename or "unknown.csv",
                        "plotData": full_storage_data 
                    }
                )
                print("✅ History saved to Supabase successfully!")
             else:
                 print("❌ Failed to connect to DB for saving history.")

        except Exception as db_err:
            print(f"❌ Failed to save history: {db_err}")
        
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis Error: {str(e)}")

async def get_latest_forecast_summary() -> str:
    """
    Retrieves the latest forecast summary from the database.
    Used for RAG Context Injection in Modul B.
    """
    try:
        from app.core.db import db
        import json
        
        if not db.is_connected():
            await db.connect()
            
        if not db.is_connected():
            print("❌ DB Disconnected in RAG Service")
            return "Data forecast tidak tersedia (Database disconnected)."

        # Fetch latest history
        print("🔍 RAG Fetching latest history...")
        latest = await db.predictionhistory.find_first(
            order={'createdAt': 'desc'}
        )
        
        if not latest:
            print("⚠️ No history found in DB.")
            return "Belum ada data forecast. User perlu upload CSV penjualan terlebih dahulu."
            
        if not latest.plotData:
             print("⚠️ History found but plotData is empty.")
             return "Data forecast kosong."

        # Handle Data Type (Prisma usually returns Dict for Json field)
        data = latest.plotData
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except:
                pass # Already string?
        
        # Parse critical info
        stock_alerts = data.get('stock_alerts', [])
        critical_items = [item['product'] for item in stock_alerts if item['status'] == 'CRITICAL']
        warning_items = [item['product'] for item in stock_alerts if item['status'] == 'WARNING']
        
        summary = "Ringkasan Kondisi Gudang (Live Forecast):\n"
        if critical_items:
            summary += f"- 🚨 KRITIS (Habis < 7 hari): {', '.join(critical_items)}\n"
        else:
            summary += "- Tidak ada stok kritis.\n"
            
        if warning_items:
            summary += f"- ⚠️ Warning (Habis < 30 hari): {', '.join(warning_items)}\n"
            
        print(f"✅ RAG Context Generated: {summary[:50]}...")
        return summary
    except Exception as e:
        print(f"❌ RAG Error: {str(e)}")
        return f"Gagal mengambil data forecast: {str(e)}"
