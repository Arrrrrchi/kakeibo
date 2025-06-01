const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 全てのルートで認証が必要
router.use(authenticateToken);

// カテゴリ一覧取得
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(categories);
  } catch (err) {
    console.error('Category fetch error:', err);
    res.status(500).json({ message: 'カテゴリの取得に失敗しました' });
  }
});

// カテゴリ作成
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'カテゴリ名を入力してください' });
    }

    // 同じユーザーの同じ名前のカテゴリをチェック
    const existing = await Category.findOne({
      where: { 
        userId: req.user.id,
        name: name 
      }
    });

    if (existing) {
      return res.status(409).json({ message: '既に同じ名前のカテゴリが存在します' });
    }

    const category = await Category.create({
      userId: req.user.id,
      name,
      color: color || '#007bff' // デフォルトの青色
    });

    res.status(201).json(category);
  } catch (err) {
    console.error('Category creation error:', err);
    res.status(500).json({ message: 'カテゴリの作成に失敗しました' });
  }
});

// カテゴリ更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    // カテゴリの存在確認と所有者チェック
    const category = await Category.findOne({
      where: { 
        id: id,
        userId: req.user.id 
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'カテゴリが見つかりません' });
    }

    // 同じユーザーの同じ名前のカテゴリをチェック（自分以外）
    if (name && name !== category.name) {
      const existing = await Category.findOne({
        where: { 
          userId: req.user.id,
          name: name,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(409).json({ message: '既に同じ名前のカテゴリが存在します' });
      }
    }

    // 更新
    await category.update({
      name: name || category.name,
      color: color || category.color
    });

    res.json(category);
  } catch (err) {
    console.error('Category update error:', err);
    res.status(500).json({ message: 'カテゴリの更新に失敗しました' });
  }
});

// カテゴリ削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // カテゴリの存在確認と所有者チェック
    const category = await Category.findOne({
      where: { 
        id: id,
        userId: req.user.id 
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'カテゴリが見つかりません' });
    }

    await category.destroy();
    res.json({ message: 'カテゴリを削除しました' });
  } catch (err) {
    console.error('Category deletion error:', err);
    res.status(500).json({ message: 'カテゴリの削除に失敗しました' });
  }
});

module.exports = router;
