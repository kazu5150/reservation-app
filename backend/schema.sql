-- 予約管理テーブル
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_number SERIAL UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- Row Level Security (RLS) を有効化
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能（待ち状況を見るため）
CREATE POLICY "Allow public read access" ON reservations
    FOR SELECT USING (true);

-- 全ユーザーが新規予約を作成可能
CREATE POLICY "Allow public insert access" ON reservations
    FOR INSERT WITH CHECK (true);

-- 管理者のみ更新・削除可能（実運用では認証を追加）
CREATE POLICY "Allow public update access" ON reservations
    FOR UPDATE USING (true);
