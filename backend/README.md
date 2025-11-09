# バックエンド（Python FastAPI）

## セットアップ手順

### 1. 仮想環境の作成と有効化

```bash
cd backend
python3 -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、Supabaseの認証情報を設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

### 4. Supabaseでデータベースを作成

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editorで`schema.sql`の内容を実行
3. Project Settings > APIからURLとAnon Keyを取得して`.env`に設定

### 5. サーバーの起動

```bash
python main.py
```

または

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

サーバーは http://localhost:8000 で起動します。

## API ドキュメント

起動後、以下のURLでAPI仕様を確認できます：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## APIエンドポイント

### 予約作成
- **POST** `/reservations`
- Body: `{"name": "名前"}`

### 全予約取得（管理者用）
- **GET** `/reservations`

### 待ち状況取得
- **GET** `/reservations/{queue_number}/wait-info`

### ステータス更新（管理者用）
- **PATCH** `/reservations/{queue_number}`
- Body: `{"status": "in_progress"}`
- ステータス: `waiting`, `in_progress`, `completed`, `cancelled`

### 待機中の予約一覧
- **GET** `/reservations/waiting/list`
