const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// ユーザーモデル
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// カテゴリモデル
const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING },
});

// 取引モデル
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  memo: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// リレーション
User.hasMany(Category, { foreignKey: 'userId' });
User.hasMany(Transaction, { foreignKey: 'userId' });
Category.belongsTo(User, { foreignKey: 'userId' });
Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

module.exports = { User, Category, Transaction };
