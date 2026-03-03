import { vi } from "vitest";
import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface";
import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface";
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";

export function createMockTransactionRepository(): ITransactionRepository {
	return {
		upsertMany: vi.fn().mockResolvedValue(0),
		getMonthlyAggregation: vi.fn().mockResolvedValue([]),
		getCategoryBreakdown: vi.fn().mockResolvedValue([]),
		findByCategory: vi.fn().mockResolvedValue([]),
		getDistinctCategories: vi.fn().mockResolvedValue([]),
		getMonthlyTrendByCategory: vi.fn().mockResolvedValue([]),
		getMonthlyInvestmentTransferTrend: vi.fn().mockResolvedValue([]),
	};
}

export function createMockBudgetRepository(): IBudgetRepository {
	return {
		findAll: vi.fn().mockResolvedValue([]),
		findAllWithMappings: vi.fn().mockResolvedValue([]),
		findById: vi.fn().mockResolvedValue(null),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		updateSortOrder: vi.fn(),
	};
}

export function createMockMappingRepository(): IMappingRepository {
	return {
		findByBudgetItemId: vi.fn().mockResolvedValue([]),
		replaceAll: vi.fn(),
		findUnmappedCategories: vi.fn().mockResolvedValue([]),
	};
}
