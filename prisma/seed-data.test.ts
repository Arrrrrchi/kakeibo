import { describe, expect, it } from "vitest"
import { seedData } from "./seed-data"

describe("シードデータ", () => {
	it("35 項目が定義されている", () => {
		expect(seedData).toHaveLength(35)
	})

	it("全項目に必須フィールドがある", () => {
		for (const item of seedData) {
			expect(item.name).toBeTruthy()
			expect(item.monthlyAmount).toBeGreaterThanOrEqual(0)
			expect([
				"monthly_fixed",
				"monthly_variable",
				"irregular_fixed",
				"irregular_variable",
			]).toContain(item.cycleType)
			expect(item.sortOrder).toBeGreaterThanOrEqual(0)
			expect(Array.isArray(item.mappings)).toBe(true)
		}
	})

	it("sortOrder が周期タイプに応じた範囲に収まっている", () => {
		const ranges: Record<string, [number, number]> = {
			monthly_fixed: [100, 199],
			monthly_variable: [200, 299],
			irregular_fixed: [300, 399],
			irregular_variable: [400, 499],
		}
		for (const item of seedData) {
			const [min, max] = ranges[item.cycleType]
			expect(item.sortOrder).toBeGreaterThanOrEqual(min)
			expect(item.sortOrder).toBeLessThanOrEqual(max)
		}
	})

	it("sortOrder に重複がない", () => {
		const sortOrders = seedData.map((item) => item.sortOrder)
		const unique = new Set(sortOrders)
		expect(unique.size).toBe(sortOrders.length)
	})

	it("費目名に重複がない", () => {
		const names = seedData.map((item) => item.name)
		const unique = new Set(names)
		expect(unique.size).toBe(names.length)
	})
})
