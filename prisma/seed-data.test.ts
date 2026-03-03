import { describe, expect, it } from "vitest";
import { seedData } from "./seed-data";

describe("シードデータ", () => {
	it("35 項目が定義されている", () => {
		expect(seedData).toHaveLength(35);
	});

	it("全項目に必須フィールドがある", () => {
		for (const item of seedData) {
			expect(item.name).toBeTruthy();
			expect(item.monthlyAmount).toBeGreaterThanOrEqual(0);
			expect([
				"monthly_fixed",
				"monthly_variable",
				"irregular_fixed",
				"irregular_variable",
			]).toContain(item.cycleType);
			expect(item.sortOrder).toBeGreaterThanOrEqual(0);
			expect(Array.isArray(item.mappings)).toBe(true);
		}
	});

	it("sortOrder が cycleType ごとに 1 から始まる連番になっている", () => {
		const grouped = new Map<string, number[]>();
		for (const item of seedData) {
			const orders = grouped.get(item.cycleType) ?? [];
			orders.push(item.sortOrder);
			grouped.set(item.cycleType, orders);
		}
		for (const [cycleType, orders] of grouped) {
			const expected = orders.map((_, i) => i + 1);
			expect(orders, `${cycleType} の sortOrder`).toEqual(expected);
		}
	});

	it("費目名に重複がない", () => {
		const names = seedData.map((item) => item.name);
		const unique = new Set(names);
		expect(unique.size).toBe(names.length);
	});
});
