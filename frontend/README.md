# フロントエンド（Next.js）

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

`.env.local` ファイルが既に作成されています：

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

バックエンドのURLが異なる場合は、このファイルを編集してください。

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## ページ構成

### `/` - 受付フォーム（トップページ）
- 名前を入力して予約を作成
- 受付後、待ち状況画面に自動遷移

### `/wait/[queue_number]` - 待ち状況画面
- 待ち番号を表示
- 待ち人数と予想待ち時間を表示
- 30秒ごとに自動更新
- ステータスに応じた表示切替

### `/admin` - 管理画面
- 全予約の一覧表示
- ステータス更新機能
- 統計情報の表示
- 10秒ごとに自動更新

## ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm run start
```

## 技術スタック

- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **App Router** - ルーティング

## ディレクトリ構造

```
frontend/
├── app/
│   ├── page.tsx                    # トップページ（受付フォーム）
│   ├── wait/
│   │   └── [queue_number]/
│   │       └── page.tsx            # 待ち状況画面
│   ├── admin/
│   │   └── page.tsx                # 管理画面
│   ├── layout.tsx                  # ルートレイアウト
│   └── globals.css                 # グローバルスタイル
├── types/
│   └── reservation.ts              # 型定義
├── public/                         # 静的ファイル
└── .env.local                      # 環境変数
```

## 型定義

`types/reservation.ts` に以下の型が定義されています：

- `Reservation` - 予約データの型
- `WaitInfo` - 待ち状況の型
- `ReservationCreate` - 予約作成リクエストの型
