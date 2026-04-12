import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateTransaction } from "@/server/actions/update-transaction";

const { mockUpdateOne } = vi.hoisted(() => ({ mockUpdateOne: vi.fn() }));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {
		updateOne = mockUpdateOne;
	},
}));

const validInput = {
	description: "テスト取引",
	amount: 1000,
	majorCategory: "食費",
	minorCategory: "外食",
	memo: null,
	isTransfer: false,
};

const mockTransaction = {
	id: "test-id",
	date: new Date("2026-01-01"),
	description: "テスト取引",
	amount: 1000,
	majorCategory: "食費",
	minorCategory: "外食",
	institution: null,
	memo: null,
	moneyforwardId: null,
	isIncome: false,
	isTransfer: false,
	importHash: "hash",
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("updateTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateOne.mockResolvedValue(mockTransaction);
	});

	it("有効な入力で成功し revalidatePath('/dashboard') が呼ばれる", async () => {
		const { revalidatePath } = await import("next/cache");

		const result = await updateTransaction("test-id", validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(mockTransaction);
		}
		expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
	});

	it("リポジトリが throw したとき { success: false } を返す", async () => {
		mockUpdateOne.mockRejectedValue(new Error("DB error"));

		const result = await updateTransaction("test-id", validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("DB error");
		}
	});
});
