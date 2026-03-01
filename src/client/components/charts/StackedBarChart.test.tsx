import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StackedBarChart } from "./StackedBarChart"

const mockMonthlyData = [
	{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
	{ month: "2025-05", totalIncome: 310000, totalExpense: 220000 },
]

const mockCategoryData = [
	{ majorCategory: "食費", minorCategory: "食料品", total: 30000, count: 10 },
	{ majorCategory: "住宅", minorCategory: "家賃", total: 80000, count: 1 },
]

describe("StackedBarChart", () => {
	it("データを渡してクラッシュせずにレンダリングできる", () => {
		expect(() => {
			render(<StackedBarChart data={mockMonthlyData} categoryData={mockCategoryData} />)
		}).not.toThrow()
	})

	it("データが空でもクラッシュしない", () => {
		expect(() => {
			render(<StackedBarChart data={[]} categoryData={[]} />)
		}).not.toThrow()
	})
})
