const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// 全てのルートで認証が必要
router.use(authenticateToken);

// ダッシュボード統計情報
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    // 今月の収入・支出
    const thisMonthStats = await getMonthlyStats(userId, thisMonth);

    // 先月の収入・支出
    const lastMonthStats = await getMonthlyStats(userId, lastMonth, thisMonth);

    // 今年の月別統計
    const yearlyStats = await getYearlyStats(userId, thisYear);

    // カテゴリ別統計（今月）
    const categoryStats = await getCategoryStats(userId, thisMonth);

    // 最近の取引（10件）
    const recentTransactions = await Transaction.findAll({
      where: { userId },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'color']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      thisMonth: thisMonthStats,
      lastMonth: lastMonthStats,
      yearly: yearlyStats,
      categories: categoryStats,
      recentTransactions
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'ダッシュボード情報の取得に失敗しました' });
  }
});

// 月別統計情報
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const monthlyStats = await getMonthlyStats(userId, startDate, endDate);
    const categoryStats = await getCategoryStats(userId, startDate, endDate);
    const dailyStats = await getDailyStats(userId, startDate, endDate);

    res.json({
      month: `${year}-${month.toString().padStart(2, '0')}`,
      ...monthlyStats,
      categories: categoryStats,
      daily: dailyStats
    });
  } catch (err) {
    console.error('Monthly stats error:', err);
    res.status(500).json({ message: '月別統計の取得に失敗しました' });
  }
});

// 年別統計情報
router.get('/yearly/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const yearlyStats = await getYearlyStats(userId, startDate, endDate);
    const categoryStats = await getCategoryStats(userId, startDate, endDate);

    res.json({
      year,
      monthly: yearlyStats,
      categories: categoryStats
    });
  } catch (err) {
    console.error('Yearly stats error:', err);
    res.status(500).json({ message: '年別統計の取得に失敗しました' });
  }
});

// ヘルパー関数：月別統計
async function getMonthlyStats(userId, startDate, endDate = null) {
  const whereCondition = {
    userId,
    date: {
      [Op.gte]: startDate,
      ...(endDate && { [Op.lte]: endDate })
    }
  };

  const income = await Transaction.sum('amount', {
    where: { ...whereCondition, type: 'income' }
  }) || 0;

  const expense = await Transaction.sum('amount', {
    where: { ...whereCondition, type: 'expense' }
  }) || 0;

  const transactionCount = await Transaction.count({
    where: whereCondition
  });

  return {
    income,
    expense,
    balance: income - expense,
    transactionCount
  };
}

// ヘルパー関数：年別統計（月別データ）
async function getYearlyStats(userId, startDate, endDate = null) {
  const sequelize = require('../db');
  
  const whereCondition = {
    userId,
    date: {
      [Op.gte]: startDate,
      ...(endDate && { [Op.lte]: endDate })
    }
  };

  const monthlyData = await Transaction.findAll({
    where: whereCondition,
    attributes: [
      [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'month'],
      'type',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'type'],
    order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'ASC']]
  });

  // データを月別に整理
  const monthlyStats = {};
  monthlyData.forEach(item => {
    const month = item.getDataValue('month').toISOString().substring(0, 7);
    if (!monthlyStats[month]) {
      monthlyStats[month] = { income: 0, expense: 0 };
    }
    monthlyStats[month][item.type] = parseFloat(item.getDataValue('total'));
  });

  // 12ヶ月分のデータを生成
  const result = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate.getFullYear(), i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    const stats = monthlyStats[monthKey] || { income: 0, expense: 0 };
    
    result.push({
      month: monthKey,
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense
    });
  }

  return result;
}

// ヘルパー関数：カテゴリ別統計
async function getCategoryStats(userId, startDate, endDate = null) {
  const whereCondition = {
    userId,
    date: {
      [Op.gte]: startDate,
      ...(endDate && { [Op.lte]: endDate })
    }
  };

  const categoryData = await Transaction.findAll({
    where: whereCondition,
    include: [{
      model: Category,
      attributes: ['id', 'name', 'color']
    }],
    attributes: [
      'type',
      'categoryId',
      [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
      [require('sequelize').fn('COUNT', require('sequelize').col('Transaction.id')), 'count']
    ],
    group: ['type', 'categoryId', 'Category.id', 'Category.name', 'Category.color'],
    order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']]
  });

  return {
    income: categoryData.filter(item => item.type === 'income'),
    expense: categoryData.filter(item => item.type === 'expense')
  };
}

// ヘルパー関数：日別統計
async function getDailyStats(userId, startDate, endDate) {
  const sequelize = require('../db');
  
  const whereCondition = {
    userId,
    date: {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    }
  };

  const dailyData = await Transaction.findAll({
    where: whereCondition,
    attributes: [
      'date',
      'type',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    group: ['date', 'type'],
    order: [['date', 'ASC']]
  });

  // データを日別に整理
  const dailyStats = {};
  dailyData.forEach(item => {
    const date = item.date;
    if (!dailyStats[date]) {
      dailyStats[date] = { income: 0, expense: 0 };
    }
    dailyStats[date][item.type] = parseFloat(item.getDataValue('total'));
  });

  // 月の全ての日のデータを生成
  const result = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const stats = dailyStats[dateKey] || { income: 0, expense: 0 };
    
    result.push({
      date: dateKey,
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

module.exports = router;
