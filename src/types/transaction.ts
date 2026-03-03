import type { TransactionModel } from "@/generated/prisma/models/Transaction";

export type Transaction = TransactionModel;

export type TransactionCreateInput = {
	date: Date;
	description: string;
	amount: number;
	majorCategory: string;
	minorCategory: string;
	institution: string | null;
	memo: string | null;
	moneyforwardId: string | null;
	isIncome: boolean;
	isTransfer: boolean;
	importHash: string;
};

export type MonthlyAggregation = {
	month: string;
	totalIncome: number;
	totalExpense: number;
};

export type CategoryBreakdown = {
	majorCategory: string;
	minorCategory: string;
	total: number;
	count: number;
};
