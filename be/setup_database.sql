-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Tables (Matching Prisma Schema)

-- products
CREATE TABLE IF NOT EXISTS products (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");

-- forecasts
CREATE TABLE IF NOT EXISTS forecasts (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" TEXT,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "lowerBound" DOUBLE PRECISION NOT NULL,
    "upperBound" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "forecasts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- chat_logs
CREATE TABLE IF NOT EXISTS chat_logs (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isHelpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- prediction_history
CREATE TABLE IF NOT EXISTS prediction_history (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "plotData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Note: In production, assume specific auth roles. For now, we allow broad access + auth checks.

-- Products
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth Write Products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Forecasts
CREATE POLICY "Public Read Forecasts" ON forecasts FOR SELECT USING (true);
CREATE POLICY "Auth Write Forecasts" ON forecasts FOR ALL USING (auth.role() = 'authenticated');

-- Documents
CREATE POLICY "Public Read Documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Auth Write Documents" ON documents FOR ALL USING (auth.role() = 'authenticated');

-- ChatLogs
CREATE POLICY "Public Insert ChatLogs" ON chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read ChatLogs" ON chat_logs FOR SELECT USING (true); -- Allow history viewing

-- PredictionHistory
CREATE POLICY "Public Read PredictionHistory" ON prediction_history FOR SELECT USING (true);
CREATE POLICY "Public Insert PredictionHistory" ON prediction_history FOR INSERT WITH CHECK (true); -- Allow saving forecasts

-- 5. Enable Realtime (Supabase)
-- Add tables to the publication to enable Realtime subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'forecasts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE forecasts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'prediction_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE prediction_history;
  END IF;
END $$;
