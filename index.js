require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3002;
const sequelize = require('./db');

// ルートのインポート
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');

// ミドルウェア
app.use(helmet()); // セキュリティヘッダー
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ヘルスチェック
app.get('/ping', (req, res) => {
  res.send('pong');
});

// API情報
app.get('/api', (req, res) => {
  res.json({
    message: '家計簿 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      transactions: '/api/transactions',
      dashboard: '/api/dashboard'
    }
  });
});

// ルートの設定
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// DB同期
sequelize.sync().then(() => {
  console.log('DBとモデルの同期が完了しました');
}).catch(err => {
  console.error('DB同期エラー:', err);
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'サーバーエラーが発生しました' });
});

// 404ハンドリング
app.use('*', (req, res) => {
  res.status(404).json({ message: 'エンドポイントが見つかりません' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API documentation: http://localhost:${PORT}/api`);
});
