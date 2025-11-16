# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

プログラミング体験会の受付管理アプリケーション。ユーザーが名前を入力して受付し、待ち番号と待ち時間を表示する。管理画面では全予約のステータスを管理できる。

## Commands

### Frontend (Next.js)
```bash
cd frontend
npm install              # 依存関係のインストール
npm run dev             # 開発サーバーの起動 (http://localhost:3000)
npm run build           # プロダクションビルド
npm run start           # プロダクションサーバーの起動
npm run lint            # ESLint の実行
```

### Backend (Python FastAPI)
```bash
cd backend
python3 -m venv venv                    # 仮想環境の作成（初回のみ）
source venv/bin/activate                # 仮想環境の有効化 (macOS/Linux)
# venv\Scripts\activate                 # Windows の場合
pip install -r requirements.txt         # 依存関係のインストール
python main.py                          # サーバーの起動 (http://localhost:8000)
# または
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API ドキュメント: http://localhost:8000/docs

### Database Setup
1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で `backend/schema.sql` を実行
3. Project Settings → API から `SUPABASE_URL` と `SUPABASE_KEY` を取得
4. `backend/.env` ファイルを作成して認証情報を設定

## Architecture

### Frontend-Backend Separation
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + Supabase (PostgreSQL)
- バックエンドは完全に独立したAPIサーバーとして動作
- フロントエンドは `process.env.NEXT_PUBLIC_API_URL` 経由でバックエンドと通信

### Key Architecture Points

#### Client Components
全ページが 'use client' ディレクティブを使用したクライアントコンポーネント。これは以下の理由による：
- `useState`, `useEffect` などの React Hooks を使用
- リアルタイム更新機能（setInterval）
- フォーム送信やボタンクリックなどのインタラクティブな操作

#### Status Flow
予約のステータス遷移:
```
waiting → in_progress → completed
   ↓
cancelled
```

ステータス更新時、バックエンドが自動的にタイムスタンプを更新:
- `in_progress`: `started_at` を現在時刻に設定
- `completed` or `cancelled`: `completed_at` を現在時刻に設定

#### Wait Time Calculation
待ち時間の計算ロジック（backend/main.py:110-115）:
```python
# 自分より前の待機中 + 体験中の人数を取得
waiting_before = count(queue_number < current AND status IN ['waiting', 'in_progress'])
position = waiting_before + 1
estimated_wait_minutes = max(0, (position - 1) * EXPERIENCE_DURATION_MINUTES)
```

#### Auto-refresh Intervals
- 管理画面: 10秒ごとに自動更新（admin/page.tsx:34）
- 待ち状況画面: 30秒ごとに自動更新（wait/[queue_number]/page.tsx）

#### CORS Configuration
バックエンドは `http://localhost:3000` からのリクエストのみ許可（main.py:16-22）。本番環境では適切なオリジンに変更が必要。

### Database Schema

**reservations テーブル**:
- `id`: UUID (主キー)
- `queue_number`: SERIAL (自動採番の待ち番号)
- `name`: TEXT (ユーザー名)
- `status`: TEXT ('waiting' | 'in_progress' | 'completed' | 'cancelled')
- `created_at`: TIMESTAMP (作成日時)
- `started_at`: TIMESTAMP (開始日時)
- `completed_at`: TIMESTAMP (完了日時)

Row Level Security (RLS) が有効で、全ユーザーに読み取り・挿入権限、更新権限を付与している（実運用では認証を追加すべき）。

### Type Safety

フロントエンドとバックエンドで型定義を共有:
- `frontend/types/reservation.ts`: TypeScript の型定義
- `backend/main.py`: Pydantic モデル

ステータスは厳密に型付けされており、不正な値を防止。

## Configuration

### Experience Duration
体験時間の変更は `backend/main.py` の定数を編集:
```python
EXPERIENCE_DURATION_MINUTES = 10  # 分単位
```

### Environment Variables
- **Backend**: `backend/.env`
  - `SUPABASE_URL`: Supabase プロジェクトの URL
  - `SUPABASE_KEY`: Supabase の anon/public key

- **Frontend**: `frontend/.env.local` (作成が必要)
  - `NEXT_PUBLIC_API_URL`: バックエンド API の URL (例: `http://localhost:8000`)

## API Endpoints

- `POST /reservations` - 新規予約作成
- `GET /reservations` - 全予約取得（管理者用）
- `GET /reservations/{queue_number}/wait-info` - 待ち状況取得
- `PATCH /reservations/{queue_number}` - ステータス更新（管理者用）
- `GET /reservations/waiting/list` - 待機中の予約一覧

詳細は http://localhost:8000/docs を参照。

## Pages Structure

- `/` - 受付フォーム（app/page.tsx）
- `/wait/[queue_number]` - 待ち状況画面（app/wait/[queue_number]/page.tsx）
- `/admin` - 管理画面（app/admin/page.tsx）

全ページが動的ルーティングとクライアントサイドレンダリングを使用。
