import type { BudgetFormData, BudgetItem, BudgetItemWithMappings } from "@/types/budget";

export type IBudgetRepository = {
	findAll(): Promise<BudgetItem[]>;
	findAllWithMappings(): Promise<BudgetItemWithMappings[]>;
	findById(id: string): Promise<BudgetItemWithMappings | null>;
	create(data: BudgetFormData): Promise<BudgetItem>;
	update(id: string, data: BudgetFormData): Promise<BudgetItem>;
	delete(id: string): Promise<void>;
	updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void>;
};
