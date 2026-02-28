# kakeibo - 家計分析ダッシュボード

マネーフォワード Me の CSV データをもとに、家計の支出を予算と比較・分析するダッシュボードアプリケーションです。

## 主な機能

- **CSV インポート**: マネーフォワード Me からエクスポートした CSV ファイル（cp932）を取り込み
- **予算マッピング**: マネーフォワードの中項目を自分で定義した予算項目にインタラクティブに紐づけ
- **予算対比レポート**: 月次の実績と予算を比較し、達成率・差額を可視化
- **サマリーダッシュボード**: KPI カード、月次推移チャート、大項目別支出構成グラフ
- **予算 CRUD**: 予算項目の追加・編集・削除（4 種類の周期パターン対応）
- **未割当検知**: どの予算にも紐づいていない支出カテゴリを自動検出・一覧表示

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15（App Router） |
| UI | React 19 + TypeScript 5 |
| スタイリング | Tailwind CSS v4 |
| ORM | Prisma |
| データベース | PostgreSQL |
| チャート | Recharts |
| パッケージマネージャー | pnpm |
| リンター / フォーマッター | Biome |

## ディレクトリ構成

```
src/
├── app/                    # App Router ルーティング
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── dashboard/
│       └── page.tsx        # メインダッシュボード
├── client/
│   ├── components/
│   │   ├── dashboard/      # ダッシュボード関連コンポーネント
│   │   ├── charts/         # チャートコンポーネント
│   │   ├── ui/             # 汎用 UI コンポーネント
│   │   ├── forms/          # フォームコンポーネント
│   │   └── layout/         # レイアウトコンポーネント
│   └── lib/                # クライアント側ヘルパー
├── server/
│   ├── lib/                # Prisma クライアント、CSV パーサー等
│   ├── repositories/       # データベースアクセス層
│   ├── usecases/           # ビジネスロジック
│   ├── loaders/            # サーバーサイドデータ取得
│   └── actions/            # サーバーアクション（副作用処理）
└── types/                  # 型定義
```

## データベーステーブル

- **transactions** — マネーフォワードから取り込んだ取引データ
- **budget_items** — 予算項目（名前、月額、周期タイプ）
- **budget_category_mappings** — 予算項目とマネーフォワード中項目の紐づけ

## 予算の周期パターン

| 周期 | 説明 | 例 |
|---|---|---|
| 毎月・固定 | 毎月発生し金額がほぼ一定 | 家賃、通信費、奨学金返済 |
| 毎月・変動 | 毎月発生するが金額が変動 | 食費、交通費、ガソリン代 |
| 不定期・固定 | 不定期だが金額が決まっている | 火災保険、NHK、Amazonプライム |
| 不定期・変動 | 不定期かつ金額も変動 | 旅行費、家具・家電、車検代 |

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# DATABASE_URL を設定

# データベースのマイグレーション
pnpm db:migrate

# シードデータの投入（デフォルト予算項目）
pnpm db:seed

# 開発サーバー起動
pnpm dev
```

## 開発コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm lint         # Biome によるリント
pnpm format       # Biome によるフォーマット
pnpm typecheck    # TypeScript 型チェック
pnpm db:migrate   # マイグレーション実行
pnpm db:seed      # シードデータ投入
pnpm db:studio    # Prisma Studio 起動
```

## ライセンス

ISC
