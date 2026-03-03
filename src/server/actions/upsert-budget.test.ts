import { describe, expect, it, vi } from "vitest";
import { upsertBudget } from "@/server/actions/upsert-budget";

const mockCreate = vi.fn().mockResolvedValue({ id: "test-id" });
const mockUpdate = vi.fn().mockResolvedValue({ id: "test-id" });

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/server/repositories/prisma-budget.repository", () => ({
	PrismaBudgetRepository: class {
		create = mockCreate;
		update = mockUpdate;
	},
}));

describe("upsertBudget", () => {
	it("費目名が空の場合はエラーを返す", async () => {
		const formData = new FormData();
		formData.set("name", "");
		formData.set("monthlyAmount", "10000");
		formData.set("cycleType", "monthly_fixed");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(false);
		expect(result.error).toContain("費目名");
	});

	it("費目名が50文字を超える場合はエラーを返す", async () => {
		const formData = new FormData();
		formData.set("name", "あ".repeat(51));
		formData.set("monthlyAmount", "10000");
		formData.set("cycleType", "monthly_fixed");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(false);
	});

	it("月額予算が負の値の場合はエラーを返す", async () => {
		const formData = new FormData();
		formData.set("name", "テスト");
		formData.set("monthlyAmount", "-1000");
		formData.set("cycleType", "monthly_fixed");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(false);
		expect(result.error).toContain("月額予算");
	});

	it("月額予算が小数の場合はエラーを返す", async () => {
		const formData = new FormData();
		formData.set("name", "テスト");
		formData.set("monthlyAmount", "100.5");
		formData.set("cycleType", "monthly_fixed");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(false);
	});

	it("有効なデータで新規作成が成功する", async () => {
		const formData = new FormData();
		formData.set("name", "テスト費目");
		formData.set("monthlyAmount", "10000");
		formData.set("cycleType", "monthly_fixed");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(true);
	});

	it("id がある場合は更新として処理される", async () => {
		const formData = new FormData();
		formData.set("id", "existing-id");
		formData.set("name", "更新テスト");
		formData.set("monthlyAmount", "20000");
		formData.set("cycleType", "monthly_variable");

		const result = await upsertBudget(formData);

		expect(result.success).toBe(true);
	});
});
