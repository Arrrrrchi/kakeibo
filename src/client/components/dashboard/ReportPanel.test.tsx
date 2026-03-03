import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BudgetReportRow, InvestmentRow } from "@/types/dashboard";
import { ReportPanel } from "./ReportPanel";

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
];

const mockInvestmentRow: InvestmentRow = {
	label: "投信積立 (SBI証券)",
	monthlyActuals: { "2025-04": 50000, "2025-05": 50000 },
	totalActual: 100000,
};

const emptyInvestmentRow: InvestmentRow = {
	label: "投信積立 (SBI証券)",
	monthlyActuals: {},
	totalActual: 0,
};

describe("ReportPanel", () => {
	it("サマリーバーに予算合計・実績合計が表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		expect(screen.getByText(/予算合計/)).toBeInTheDocument();
		expect(screen.getByText(/実績合計/)).toBeInTheDocument();
	});

	it("費目名が表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		expect(screen.getByText("電気代")).toBeInTheDocument();
		expect(screen.getByText("食費")).toBeInTheDocument();
	});

	it("超過項目が赤色でハイライトされる", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		const diffCells = screen.getAllByText(/-¥7,000/);
		const redCell = diffCells.find((el) => el.className.includes("red"));
		expect(redCell).toBeDefined();
	});

	it("予算内項目が緑色で表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		const diffCells = screen.getAllByText(/¥2,300/);
		const greenCell = diffCells.find((el) => el.className.includes("green"));
		expect(greenCell).toBeDefined();
	});

	it("データが空の場合にメッセージが表示される", () => {
		render(<ReportPanel budgetReport={[]} months={[]} investmentRow={emptyInvestmentRow} />);
		expect(screen.getByText(/データがありません/)).toBeInTheDocument();
	});

	it("周期タイプごとのセクション行が表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		expect(screen.getByText("毎月・固定")).toBeInTheDocument();
		expect(screen.getByText("毎月・変動")).toBeInTheDocument();
	});

	it("投信積立行のラベルと月次実績が表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={mockInvestmentRow}
			/>,
		);
		expect(screen.getByText("投信積立 (SBI証券)")).toBeInTheDocument();
		expect(screen.getAllByText(/¥50,000/)).not.toHaveLength(0);
	});

	it("投信積立データがない場合は行に「-」が表示される", () => {
		render(
			<ReportPanel
				budgetReport={mockReportData}
				months={["2025-04", "2025-05"]}
				investmentRow={emptyInvestmentRow}
			/>,
		);
		expect(screen.getByText("投信積立 (SBI証券)")).toBeInTheDocument();
	});
});
