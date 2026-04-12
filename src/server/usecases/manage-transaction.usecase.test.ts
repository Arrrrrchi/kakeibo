import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockTransactionRepository } from "@/test/helpers/mock-repositories";
import { ManageTransactionUsecase } from "./manage-transaction.usecase";

const validInput = {
	description: "テスト取引",
	amount: 1000,
	majorCategory: "食費",
	minorCategory: "外食",
	memo: null,
	isTransfer: false,
};

describe("ManageTransactionUsecase", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("updateTransaction", () => {
		it("repo.updateOne を正しい引数で呼び出す", async () => {
			const mockRepo = createMockTransactionRepository();
			const usecase = new ManageTransactionUsecase(mockRepo);
			const input = {
				description: "テスト取引",
				amount: 1000,
				majorCategory: "食費",
				minorCategory: "外食",
				memo: "メモ",
				isTransfer: false,
			};
			const mockTransaction = { id: "tx-1", ...input } as Parameters<
				typeof mockRepo.updateOne
			>[1] & { id: string };
			vi.mocked(mockRepo.updateOne).mockResolvedValue(mockTransaction as never);

			const result = await usecase.updateTransaction("tx-1", input);

			expect(mockRepo.updateOne).toHaveBeenCalledWith("tx-1", input);
			expect(result).toBe(mockTransaction);
		});

		it("repo.updateOne が throw したとき updateTransaction も throw する", async () => {
			const mockRepo = createMockTransactionRepository();
			const usecase = new ManageTransactionUsecase(mockRepo);
			vi.mocked(mockRepo.updateOne).mockRejectedValue(new Error("DB エラー"));

			await expect(
				usecase.updateTransaction("tx-1", {
					description: "テスト",
					amount: 100,
					majorCategory: "食費",
					minorCategory: "外食",
					memo: null,
					isTransfer: false,
				}),
			).rejects.toThrow("DB エラー");
		});

		describe("バリデーション", () => {
			it("id が空のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(usecase.updateTransaction("", validInput)).rejects.toThrow(
					"取引IDが指定されていません",
				);
			});

			it("description が空のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, description: "" }),
				).rejects.toThrow("説明は1〜200文字で入力してください");
			});

			it("description が201文字のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", {
						...validInput,
						description: "あ".repeat(201),
					}),
				).rejects.toThrow("説明は1〜200文字で入力してください");
			});

			it("amount が負値のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, amount: -1 }),
				).rejects.toThrow("金額は0以上の整数で入力してください");
			});

			it("amount が小数（0.5）のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, amount: 0.5 }),
				).rejects.toThrow("金額は0以上の整数で入力してください");
			});

			it("majorCategory が空のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, majorCategory: "" }),
				).rejects.toThrow("大分類は1〜50文字で入力してください");
			});

			it("minorCategory が空のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, minorCategory: "" }),
				).rejects.toThrow("小分類は1〜50文字で入力してください");
			});

			it("memo が501文字のとき throw する", async () => {
				const mockRepo = createMockTransactionRepository();
				const usecase = new ManageTransactionUsecase(mockRepo);

				await expect(
					usecase.updateTransaction("tx-1", { ...validInput, memo: "あ".repeat(501) }),
				).rejects.toThrow("メモは500文字以内で入力してください");
			});
		});
	});

	describe("deleteTransaction", () => {
		it("repo.deleteOne を正しい引数で呼び出す", async () => {
			const mockRepo = createMockTransactionRepository();
			const usecase = new ManageTransactionUsecase(mockRepo);

			await usecase.deleteTransaction("tx-1");

			expect(mockRepo.deleteOne).toHaveBeenCalledWith("tx-1");
		});

		it("repo.deleteOne が throw したとき deleteTransaction も throw する", async () => {
			const mockRepo = createMockTransactionRepository();
			const usecase = new ManageTransactionUsecase(mockRepo);
			vi.mocked(mockRepo.deleteOne).mockRejectedValue(new Error("削除エラー"));

			await expect(usecase.deleteTransaction("tx-1")).rejects.toThrow("削除エラー");
		});
	});
});
