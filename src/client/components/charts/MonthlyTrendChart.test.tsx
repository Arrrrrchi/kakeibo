import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MonthlyTrendChart } from "./MonthlyTrendChart"

const mockData = [
	{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
	{ month: "2025-05", totalIncome: 310000, totalExpense: 220000 },
	{ month: "2025-06", totalIncome: 280000, totalExpense: 190000 },
]

describe("MonthlyTrendChart", () => {
	it("データを渡してクラッシュせずにレンダリングできる", () => {
		expect(() => {
			render(<MonthlyTrendChart data={mockData} />)
		}).not.toThrow()
	})

	it("データが空でもクラッシュしない", () => {
		expect(() => {
			render(<MonthlyTrendChart data={[]} />)
		}).not.toThrow()
	})
})
