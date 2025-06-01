const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 全てのルートで認証が必要
router.use(authenticateToken);

// 現在のユーザー情報取得
router.get('/me', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    res.json(user);
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ message: 'ユーザー情報の取得に失敗しました' });
  }
});

// ユーザー情報更新
router.put('/me', async (req, res) => {
  try {
    const { name, email } = req.body;

    // 入力チェック
    if (!name && !email) {
      return res.status(400).json({ message: '更新する項目を指定してください' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    // メールアドレス重複チェック
    if (email && email !== user.email) {
      const existing = await User.findOne({ 
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      });
      
      if (existing) {
        return res.status(409).json({ message: '既に登録済みのメールアドレスです' });
      }
    }

    // 更新
    await user.update({
      name: name || user.name,
      email: email || user.email
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ message: 'ユーザー情報の更新に失敗しました' });
  }
});

// パスワード変更
router.put('/me/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '現在のパスワードと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'パスワードは6文字以上で入力してください' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    // 現在のパスワード確認
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: '現在のパスワードが正しくありません' });
    }

    // 新しいパスワードをハッシュ化して更新
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ passwordHash: newPasswordHash });

    res.json({ message: 'パスワードを変更しました' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'パスワードの変更に失敗しました' });
  }
});

// アカウント削除
router.delete('/me', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'パスワードを入力してください' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    // パスワード確認
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'パスワードが正しくありません' });
    }

    // ユーザー削除（関連データも自動削除される）
    await user.destroy();

    res.json({ message: 'アカウントを削除しました' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'アカウント削除に失敗しました' });
  }
});

module.exports = router;
