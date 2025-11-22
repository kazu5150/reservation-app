# プログラミング体験会 受付管理アプリ

体験会の申し込みを管理し、待ち番号と待ち時間を表示する Web アプリケーションです。

## 機能

### ユーザー向け機能
- ✅ 名前を入力して受付
- ✅ 待ち番号の表示
- ✅ 待ち人数と予想待ち時間の表示（リアルタイム更新: 10秒ごと）
- ✅ **各席（A席、B席、C席）の状況をプログレスバーで表示**
  - 利用者名と残り時間を視覚的に表示
  - 体験開始時刻を考慮した正確な残り時間計算
- ✅ **体験時間超過の警告表示**
  - 10分を超過した席を赤色で強調表示
  - 超過時間を分単位で表示
- ✅ **体験終了時のアラート音**
  - 残り時間が0になった瞬間に音で通知
  - 重複アラート防止機能付き
- ✅ **トップ画面でのステータス更新**
  - 管理画面に移動せず、トップ画面から直接「開始」「完了」操作が可能
  - 待機中の方を即座に案内開始できる

### 管理者向け機能
- ✅ 全予約の一覧表示（新しい順にソート）
- ✅ ステータス管理（待機中 → 体験中 → 完了）
- ✅ **同時に最大3人まで体験可能**（上限チェック機能付き）
- ✅ キャンセル機能
- ✅ 統計情報の表示（待機中、体験中、完了の人数）
- ✅ **次の案内対象者の表示**
  - 空席状況に応じて次に案内すべき人を自動表示
  - 優先順位を視覚的に確認可能
- ✅ **現場対応に最適化された大きなUI**
  - ボタン、文字、数字を大型化し視認性を向上
  - タッチ操作に適した十分な余白とサイズ

## スクリーンショット

### 受付フォーム
ユーザーは名前を入力して体験会に申し込みます。トップページには待ち状況と各席の状況がプログレスバーで表示されます。

<img src="screenshots/registration-form.png" alt="受付フォーム" width="450">

### 待ち状況画面
受付完了後、ユーザーは自分の待ち番号と予想待ち時間を確認できます。

<img src="screenshots/wait-screen.png" alt="待ち状況画面" width="300">

### 管理画面
スタッフは全予約の状況を確認し、ステータスを管理できます。

<img src="screenshots/admin-screen.png" alt="管理画面" width="650">

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**

### バックエンド
- **Python 3.x**
- **FastAPI**
- **Supabase** (PostgreSQL)

## プロジェクト構造

```
reservation-app/
├── frontend/          # Next.js フロントエンド
│   ├── app/
│   │   ├── page.tsx          # 受付フォーム
│   │   ├── wait/[queue_number]/page.tsx  # 待ち状況画面
│   │   └── admin/page.tsx    # 管理画面
│   └── types/
│       └── reservation.ts    # 型定義
│
└── backend/           # Python FastAPI バックエンド
    ├── main.py        # API実装
    ├── schema.sql     # データベーススキーマ
    ├── requirements.txt
    └── README.md
```

## セットアップ

### 1. Supabase のセットアップ

1. [Supabase](https://supabase.com/) でアカウント作成とプロジェクト作成
2. SQL Editor で `backend/schema.sql` の内容を実行
3. Project Settings → API から以下を取得：
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon/public key)

### 2. バックエンドのセットアップ

```bash
cd backend

# 仮想環境の作成と有効化
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集して Supabase の認証情報を設定

# サーバーの起動
python main.py
```

バックエンドは http://localhost:8000 で起動します。

API ドキュメント: http://localhost:8000/docs

### 3. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

## 使い方

### ユーザー側の操作（トップ画面）

1. トップページ (http://localhost:3000) で現在の待ち状況を確認
   - 待機中の人数
   - 体験中の人数
   - 予想待ち時間
   - **各席（A席、B席、C席）の利用状況と残り時間**
   - **体験時間超過の警告**（10分超過した席は赤色で表示）
2. 名前を入力して受付
3. 待ち番号が表示される画面に自動遷移
4. 待ち人数と予想待ち時間を確認
5. 画面は自動更新される（トップページ: 10秒、待ち状況画面: 30秒）

### スタッフ側の操作（トップ画面から）

トップ画面から直接ステータス管理が可能です：

1. **体験中の方を完了にする**
   - 各席カードの「完了」ボタンをクリック
   - 体験時間超過の席は優先的に完了処理を推奨
2. **待機中の方を案内する**
   - 待機者リストの「開始」ボタンをクリック
   - 自動的に空いている席に割り当て
3. **アラート音の対応**
   - 残り時間が0になると自動で音が鳴る
   - 完了操作を行うまで超過席として表示される

### 管理者側の操作（管理画面）

1. 管理画面 (http://localhost:3000/admin) にアクセス
2. 統計情報を確認（待機中、体験中、完了の人数）
3. **次の案内対象者を確認**
   - 空席がある場合、優先的に案内すべき人が強調表示される
   - 「案内開始」ボタンで即座に体験開始
4. 予約一覧から各予約のステータスを更新：
   - 「開始」ボタン: 待機中 → 体験中（**最大3人まで同時に体験可能**）
   - 「完了」ボタン: 体験中 → 完了
   - 「キャンセル」ボタン: キャンセル状態に変更
5. 画面は10秒ごとに自動更新

**注意**: 体験中が既に3人の場合、4人目を開始しようとするとエラーメッセージが表示されます。

## API エンドポイント

### 予約作成
```
POST /reservations
Body: {"name": "名前"}
```

### 全予約取得（管理者用）
```
GET /reservations
```

### 待ち状況取得
```
GET /reservations/{queue_number}/wait-info
```

### 統計情報取得（トップページ用）
```
GET /stats
Response: {
  "waiting_count": 3,
  "in_progress_count": 2,
  "completed_count": 5,
  "estimated_wait_minutes": 10,
  "seats": [
    {
      "seat_name": "A席",
      "name": "佐藤",
      "remaining_minutes": 8.5,
      "queue_number": 15
    },
    {
      "seat_name": "B席",
      "name": "高橋",
      "remaining_minutes": 5.2,
      "queue_number": 18
    }
  ],
  "overtime_seats": [
    {
      "seat_name": "C席",
      "name": "田中",
      "overtime_minutes": 3.5,
      "queue_number": 12
    }
  ]
}
```

**注**: `overtime_seats` は体験時間（10分）を超過した席の情報を含みます。

### ステータス更新（管理者用）
```
PATCH /reservations/{queue_number}
Body: {"status": "in_progress"}
```

ステータス: `waiting`, `in_progress`, `completed`, `cancelled`

**注意**: 体験中が既に3人の場合、`in_progress` への更新は 400 エラーを返します。

## データベーススキーマ

### reservations テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| queue_number | SERIAL | 待ち番号（自動採番） |
| name | TEXT | 名前 |
| status | TEXT | ステータス |
| created_at | TIMESTAMP | 作成日時 |
| started_at | TIMESTAMP | 開始日時 |
| completed_at | TIMESTAMP | 完了日時 |

## カスタマイズ

### 体験時間の変更

`backend/main.py` の以下の部分を編集：

```python
EXPERIENCE_DURATION_MINUTES = 10  # 分単位で変更
```

### 同時受入人数の変更

`backend/main.py` の以下の部分を編集：

```python
MAX_CONCURRENT_EXPERIENCES = 3  # 同時に体験できる最大人数を変更
```

変更後、待ち時間の計算やバリデーションが自動的に調整されます。

**例**: 5人まで同時対応にする場合は `MAX_CONCURRENT_EXPERIENCES = 5` に変更

## 技術的な詳細

### アラート音の実装

体験時間終了時のアラート音は Web Audio API を使用して実装されています：

- 残り時間が0になった瞬間に自動的に音が鳴る
- 同じ席に対して重複してアラートを鳴らさない仕組み
- ブラウザのネイティブ機能を使用（外部ファイル不要）

### UI設計の特徴

現場での使いやすさを重視した設計：

- **大きなタッチターゲット**: ボタンは `py-3 px-4` 以上のパディング
- **視認性の高いフォント**: 番号は `text-6xl` ～ `text-8xl`、ボタンテキストは `text-lg` 以上
- **明確な色分け**:
  - 待機中: アンバー色
  - 体験中: エメラルド色
  - 完了: ブルー色
  - 超過/警告: レッド色
- **十分な余白**: カード間隔 `gap-4`、パディング `p-5` ～ `p-10`

### リアルタイム更新

- トップページ: 10秒ごとに統計情報と待機リストを自動更新
- 待機画面: 30秒ごとに待ち状況を自動更新
- 管理画面: 10秒ごとに予約一覧を自動更新

## 開発

### バックエンドの開発

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### フロントエンドの開発

```bash
cd frontend
npm run dev
```

## ライセンス

MIT

## サポート

問題が発生した場合は、以下を確認してください：

1. Supabase の認証情報が正しく設定されているか
2. バックエンドとフロントエンドが両方起動しているか
3. 環境変数が正しく設定されているか
