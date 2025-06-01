const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// 全てのルートで認証が必要
router.use(authenticateToken);

// 統計情報取得（詳細ルートより前に定義）
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 日付条件設定
    const dateCondition = {};
    if (startDate || endDate) {
      if (startDate) dateCondition[Op.gte] = startDate;
      if (endDate) dateCondition[Op.lte] = endDate;
    }

    const whereCondition = { 
      userId: req.user.id,
      ...(Object.keys(dateCondition).length > 0 && { date: dateCondition })
    };

    // 収入と支出の合計
    const incomeTotal = await Transaction.sum('amount', {
      where: { ...whereCondition, type: 'income' }
    }) || 0;

    const expenseTotal = await Transaction.sum('amount', {
      where: { ...whereCondition, type: 'expense' }
    }) || 0;

    // カテゴリ別支出
    const expenseByCategory = await Transaction.findAll({
      where: { ...whereCondition, type: 'expense' },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }],
      attributes: [
        'categoryId',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
      ],
      group: ['categoryId', 'Category.id', 'Category.name', 'Category.color'],
      order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']]
    });

    res.json({
      income: incomeTotal,
      expense: expenseTotal,
      balance: incomeTotal - expenseTotal,
      expenseByCategory
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ message: '統計情報の取得に失敗しました' });
  }
});

// 取引一覧取得（フィルタリング対応）
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      categoryId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    // 条件設定
    const whereCondition = { userId: req.user.id };
    
    if (type && ['income', 'expense'].includes(type)) {
      whereCondition.type = type;
    }
    
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    if (startDate || endDate) {
      whereCondition.date = {};
      if (startDate) whereCondition.date[Op.gte] = startDate;
      if (endDate) whereCondition.date[Op.lte] = endDate;
    }

    // ページネーション
    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereCondition,
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Transaction fetch error:', err);
    res.status(500).json({ message: '取引の取得に失敗しました' });
  }
});

// 取引詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { 
        id: id,
        userId: req.user.id 
      },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }]
    });

    if (!transaction) {
      return res.status(404).json({ message: '取引が見つかりません' });
    }

    res.json(transaction);
  } catch (err) {
    console.error('Transaction fetch error:', err);
    res.status(500).json({ message: '取引の取得に失敗しました' });
  }
});

// 取引作成
router.post('/', async (req, res) => {
  try {
    const { type, amount, categoryId, date, memo } = req.body;

    // バリデーション
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: '種別（収入/支出）を正しく指定してください' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: '金額を正しく入力してください' });
    }

    if (!categoryId) {
      return res.status(400).json({ message: 'カテゴリを選択してください' });
    }

    if (!date) {
      return res.status(400).json({ message: '日付を入力してください' });
    }

    // カテゴリの存在確認と所有者チェック
    const category = await Category.findOne({
      where: { 
        id: categoryId,
        userId: req.user.id 
      }
    });

    if (!category) {
      return res.status(400).json({ message: '指定されたカテゴリが見つかりません' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount: parseFloat(amount),
      categoryId,
      date,
      memo: memo || ''
    });

    // 作成した取引をカテゴリ情報と一緒に返す
    const transactionWithCategory = await Transaction.findOne({
      where: { id: transaction.id },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }]
    });

    res.status(201).json(transactionWithCategory);
  } catch (err) {
    console.error('Transaction creation error:', err);
    res.status(500).json({ message: '取引の作成に失敗しました' });
  }
});

// 取引更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, categoryId, date, memo } = req.body;

    // 取引の存在確認と所有者チェック
    const transaction = await Transaction.findOne({
      where: { 
        id: id,
        userId: req.user.id 
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: '取引が見つかりません' });
    }

    // バリデーション
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: '種別（収入/支出）を正しく指定してください' });
    }

    if (amount !== undefined && (amount <= 0 || isNaN(amount))) {
      return res.status(400).json({ message: '金額を正しく入力してください' });
    }

    // カテゴリの存在確認
    if (categoryId) {
      const category = await Category.findOne({
        where: { 
          id: categoryId,
          userId: req.user.id 
        }
      });

      if (!category) {
        return res.status(400).json({ message: '指定されたカテゴリが見つかりません' });
      }
    }

    // 更新
    await transaction.update({
      type: type || transaction.type,
      amount: amount !== undefined ? parseFloat(amount) : transaction.amount,
      categoryId: categoryId || transaction.categoryId,
      date: date || transaction.date,
      memo: memo !== undefined ? memo : transaction.memo
    });

    // 更新した取引をカテゴリ情報と一緒に返す
    const updatedTransaction = await Transaction.findOne({
      where: { id: transaction.id },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }]
    });

    res.json(updatedTransaction);
  } catch (err) {
    console.error('Transaction update error:', err);
    res.status(500).json({ message: '取引の更新に失敗しました' });
  }
});

// 取引削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 取引の存在確認と所有者チェック
    const transaction = await Transaction.findOne({
      where: { 
        id: id,
        userId: req.user.id 
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: '取引が見つかりません' });
    }

    await transaction.destroy();
    res.json({ message: '取引を削除しました' });
  } catch (err) {
    console.error('Transaction deletion error:', err);
    res.status(500).json({ message: '取引の削除に失敗しました' });
  }
});

module.exports = router;
