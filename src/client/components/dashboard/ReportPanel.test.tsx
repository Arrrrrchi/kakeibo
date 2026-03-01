import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReportPanel } from "./ReportPanel"
import type { BudgetReportRow } from "@/types/dashboard"

const mockReportData: BudgetReportRow[] = [
	{
		budgetItem: {
			id: "1",
			name: "電気代",
			monthlyAmount: 10000,
			cycleType: "monthly_fixed",
			sortOrder: 100,
			createdAt: new Date(),
			updatedAt: new Date(),
			mappings: [],
		},
		monthlyActuals: { "2025-04": 8500, "2025-05": 9200 },
		totalActual: 17700,
		totalBudget: 20000,
		difference: 2300,
		achievementRate: 88.5,
	},
	{
		budgetItem: {
			id: "2",
			name: "食費",
			monthlyAmount: 30000,
			cycleType: "monthly_variable",
			sortOrder: 200,
			createdAt: new Date(),
			updatedAt: new Date(),
			mappings: [],
		},
		monthlyActuals: { "2025-04": 35000, "2025-05": 32000 },
		totalActual: 67000,
		totalBudget: 60000,
		difference: -7000,
		achievementRate: 111.7,
	},
]

describe("ReportPanel", () => {
	it("サマリーバーに予算合計・実績合計が表示される", () => {
		render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)
		expect(screen.getByText(/予算合計/)).toBeInTheDocument()
		expect(screen.getByText(/実績合計/)).toBeInTheDocument()
	})

	it("費目名が表示される", () => {
		render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)
		expect(screen.getByText("電気代")).toBeInTheDocument()
		expect(screen.getByText("食費")).toBeInTheDocument()
	})

	it("超過項目が赤色でハイライトされる", () => {
		render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)
		const diffCells = screen.getAllByText(/-¥7,000/)
		const redCell = diffCells.find((el) => el.className.includes("red"))
		expect(redCell).toBeDefined()
	})

	it("予算内項目が緑色で表示される", () => {
		render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)
		const diffCells = screen.getAllByText(/¥2,300/)
		const greenCell = diffCells.find((el) => el.className.includes("green"))
		expect(greenCell).toBeDefined()
	})

	it("データが空の場合にメッセージが表示される", () => {
		render(<ReportPanel budgetReport={[]} months={[]} />)
		expect(screen.getByText(/データがありません/)).toBeInTheDocument()
	})

	it("周期タイプごとのセクション行が表示される", () => {
		render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)
		expect(screen.getByText("毎月・固定")).toBeInTheDocument()
		expect(screen.getByText("毎月・変動")).toBeInTheDocument()
	})
})
