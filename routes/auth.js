const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createDefaultCategories } = require('../utils/defaultCategories');

// JWTシークレットキー（本来は環境変数で管理）
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// ユーザー登録API
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: '全ての項目を入力してください' });
    }

    // メールアドレスの重複チェック
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: '既に登録済みのメールアドレスです' });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    // デフォルトカテゴリを作成
    await createDefaultCategories(user.id);

    res.status(201).json({ 
      id: user.id, 
      name: user.name, 
      email: user.email 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: '登録に失敗しました' });
  }
});

// ログインAPI
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください' });
    }

    // ユーザー検索
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います' });
    }

    // パスワード検証
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います' });
    }

    // JWTトークン生成
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'ログインに失敗しました' });
  }
});

module.exports = router;