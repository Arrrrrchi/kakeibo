import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CategoryPieChart } from "./CategoryPieChart"

const mockData = [
	{ majorCategory: "食費", minorCategory: "食料品", total: 30000, count: 10 },
	{ majorCategory: "食費", minorCategory: "外食", total: 15000, count: 5 },
	{ majorCategory: "住宅", minorCategory: "家賃", total: 80000, count: 1 },
	{ majorCategory: "交通費", minorCategory: "電車", total: 10000, count: 20 },
]

describe("CategoryPieChart", () => {
	it("データを渡してクラッシュせずにレンダリングできる", () => {
		expect(() => {
			render(<CategoryPieChart data={mockData} />)
		}).not.toThrow()
	})

	it("データが空でもクラッシュしない", () => {
		expect(() => {
			render(<CategoryPieChart data={[]} />)
		}).not.toThrow()
	})
})
