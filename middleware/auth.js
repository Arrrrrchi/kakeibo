const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// JWT認証ミドルウェア
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'アクセストークンが必要です' });
    }

    // トークン検証
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ユーザー情報を取得
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: '無効なトークンです' });
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'トークンの有効期限が切れています' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    
    console.error('Authentication error:', err);
    return res.status(500).json({ message: '認証エラーが発生しました' });
  }
};

module.exports = { authenticateToken };
