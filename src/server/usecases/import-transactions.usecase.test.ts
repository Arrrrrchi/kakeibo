import { describe, expect, it, vi } from "vitest";
import { createMockTransactionRepository } from "@/test/helpers/mock-repositories";
import type { TransactionCreateInput } from "@/types/transaction";
import { ImportTransactionsUsecase } from "./import-transactions.usecase";

const mockTransactions: TransactionCreateInput[] = [
	{
		date: new Date("2025-04-15"),
		description: "東京電力",
		amount: 8500,
		majorCategory: "水道・光熱費",
		minorCategory: "電気代",
		institution: "三井住友銀行",
		memo: null,
		moneyforwardId: "mf001",
		isIncome: false,
		importHash: "abc123",
	},
	{
		date: new Date("2025-04-20"),
		description: "スーパー",
		amount: 3000,
		majorCategory: "食費",
		minorCategory: "食料品",
		institution: null,
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		importHash: "def456",
	},
];

describe("ImportTransactionsUsecase", () => {
	it("リポジトリの upsertMany にデータを渡して件数を返す", async () => {
		const mockRepo = createMockTransactionRepository();
		vi.mocked(mockRepo.upsertMany).mockResolvedValue(2);

		const usecase = new ImportTransactionsUsecase(mockRepo);
		const result = await usecase.execute(mockTransactions);

		expect(mockRepo.upsertMany).toHaveBeenCalledWith(mockTransactions);
		expect(result).toBe(2);
	});

	it("空配列の場合は 0 を返す", async () => {
		const mockRepo = createMockTransactionRepository();
		vi.mocked(mockRepo.upsertMany).mockResolvedValue(0);

		const usecase = new ImportTransactionsUsecase(mockRepo);
		const result = await usecase.execute([]);

		expect(result).toBe(0);
	});
});
