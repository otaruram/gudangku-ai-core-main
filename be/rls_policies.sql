-- Enable pgvector extension (Required for Document embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplistic/Open for now as Authentication is "Later")
-- In real prod, you'd check `auth.uid()`

-- Products: Everyone can read, only auth users can write (Example)
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth Write Products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Forecasts: Same
CREATE POLICY "Public Read Forecasts" ON forecasts FOR SELECT USING (true);
CREATE POLICY "Auth Write Forecasts" ON forecasts FOR ALL USING (auth.role() = 'authenticated');

-- Documents: Read only for authenticated? Or public for demo?
-- Let's make it public read for now to ensure the AI assistant works easily without complex auth headers yet
CREATE POLICY "Public Read Documents" ON documents FOR SELECT USING (true);

-- ChatLogs: Insert only for public (anonymous chat)
CREATE POLICY "Public Insert ChatLogs" ON chat_logs FOR INSERT WITH CHECK (true);
-- Read only for admins (authenticated)
CREATE POLICY "Admin Read ChatLogs" ON chat_logs FOR SELECT USING (auth.role() = 'authenticated');
