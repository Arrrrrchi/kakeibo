const { Category } = require('../models');

// デフォルトカテゴリを作成する関数
async function createDefaultCategories(userId) {
  const defaultCategories = [
    // 支出カテゴリ
    { name: '食費', color: '#FF6B6B', userId },
    { name: '交通費', color: '#4ECDC4', userId },
    { name: '住居費', color: '#45B7D1', userId },
    { name: '光熱費', color: '#FFA07A', userId },
    { name: '通信費', color: '#98D8C8', userId },
    { name: '娯楽費', color: '#F7DC6F', userId },
    { name: '衣服費', color: '#BB8FCE', userId },
    { name: '医療費', color: '#85C1E9', userId },
    { name: '教育費', color: '#F8C471', userId },
    { name: 'その他', color: '#AED6F1', userId },
    
    // 収入カテゴリ
    { name: '給与', color: '#58D68D', userId },
    { name: 'ボーナス', color: '#52BE80', userId },
    { name: '副業', color: '#7DCEA0', userId },
    { name: '投資', color: '#A9DFBF', userId },
    { name: 'その他収入', color: '#D5F4E6', userId }
  ];

  try {
    // 重複チェックをして作成
    for (const category of defaultCategories) {
      const existing = await Category.findOne({
        where: { 
          name: category.name,
          userId: category.userId 
        }
      });
      
      if (!existing) {
        await Category.create(category);
      }
    }
    
    console.log(`ユーザー ${userId} のデフォルトカテゴリを作成しました`);
  } catch (error) {
    console.error('デフォルトカテゴリ作成エラー:', error);
  }
}

module.exports = { createDefaultCategories };
