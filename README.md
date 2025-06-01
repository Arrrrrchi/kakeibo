# 家計簿アプリケーション (Kakeibo)

Node.js + Express + PostgreSQLで構築された家計簿管理アプリケーションです。

## 機能

- ユーザー登録・ログイン
- カテゴリ管理（収入・支出）
- 取引記録（収入・支出の登録・編集・削除）
- 統計情報とダッシュボード
- 月別・年別分析
- JWTベースの認証システム

## セットアップ

### 必要な環境

- Node.js (v16以上)
- PostgreSQL (v12以上)
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/Arrrrrchi/kakeibo.git
cd kakeibo
```

2. 依存関係をインストール
```bash
npm install
```

3. PostgreSQLデータベースを作成
```bash
createdb kakeibo_db
```

4. 環境変数を設定
`.env`ファイルを作成し、以下のように設定してください：
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kakeibo_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

5. サーバーを起動
```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

## API エンドポイント

### 認証 (`/api/auth`)

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### ユーザー管理 (`/api/users`)

- `GET /api/users/me` - 現在のユーザー情報取得
- `PUT /api/users/me` - ユーザー情報更新
- `PUT /api/users/me/password` - パスワード変更
- `DELETE /api/users/me` - アカウント削除

### カテゴリ管理 (`/api/categories`)

- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成
- `PUT /api/categories/:id` - カテゴリ更新
- `DELETE /api/categories/:id` - カテゴリ削除

### 取引管理 (`/api/transactions`)

- `GET /api/transactions` - 取引一覧取得（フィルタリング・ページネーション対応）
- `GET /api/transactions/:id` - 取引詳細取得
- `POST /api/transactions` - 取引作成
- `PUT /api/transactions/:id` - 取引更新
- `DELETE /api/transactions/:id` - 取引削除
- `GET /api/transactions/stats/summary` - 統計サマリー取得

### ダッシュボード (`/api/dashboard`)

- `GET /api/dashboard` - ダッシュボード情報取得
- `GET /api/dashboard/monthly/:year/:month` - 月別統計取得
- `GET /api/dashboard/yearly/:year` - 年別統計取得

## 使用例

### ユーザー登録
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "password": "password123"
  }'
```

### ログイン
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tanaka@example.com",
    "password": "password123"
  }'
```

### 取引作成
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "expense",
    "amount": 1500,
    "categoryId": 1,
    "date": "2025-06-02",
    "memo": "昼食代"
  }'
```

## 技術スタック

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcrypt
- **Development**: nodemon, dotenv

## プロジェクト構造

```
├── db.js                 # データベース接続設定
├── index.js              # メインサーバーファイル
├── models.js             # Sequelizeモデル定義
├── middleware/
│   └── auth.js           # JWT認証ミドルウェア
├── routes/
│   ├── auth.js           # 認証ルート
│   ├── users.js          # ユーザー管理ルート
│   ├── categories.js     # カテゴリ管理ルート
│   ├── transactions.js   # 取引管理ルート
│   └── dashboard.js      # ダッシュボードルート
├── utils/
│   └── defaultCategories.js # デフォルトカテゴリ作成
├── .env                  # 環境変数設定
└── package.json          # プロジェクト設定
```

## ライセンス

ISC