import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteTransaction } from "@/server/actions/delete-transaction";

const { mockDeleteOne } = vi.hoisted(() => ({ mockDeleteOne: vi.fn() }));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {
		deleteOne = mockDeleteOne;
	},
}));

describe("deleteTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteOne.mockResolvedValue(undefined);
	});

	it("有効な id で成功し revalidatePath('/dashboard') が呼ばれる", async () => {
		const { revalidatePath } = await import("next/cache");

		const result = await deleteTransaction("test-id");

		expect(result.success).toBe(true);
		expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
	});

	it("id が空文字の場合はエラーを返す", async () => {
		const result = await deleteTransaction("");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeTruthy();
		}
	});

	it("リポジトリが throw したとき { success: false } を返す", async () => {
		mockDeleteOne.mockRejectedValue(new Error("DB error"));

		const result = await deleteTransaction("test-id");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("取引の削除に失敗しました");
		}
	});
});
