import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DashboardOverview } from "@/types/dashboard";
import { getExpenseRateLevel, IncomeExpenseSummaryCard } from "./IncomeExpenseSummaryCard";

const baseOverview: DashboardOverview = {
	period: { from: "2025-01", to: "2025-12", monthCount: 12 },
	totalIncome: 3600000,
	totalExpense: 2880000,
	totalInvestment: 360000,
	mappedIncome: 3600000,
	unmappedIncome: 0,
	expenseRate: 0.8,
	savingsRate: 0.1,
	monthlyAvgIncome: 300000,
	monthlyAvgExpense: 240000,
	byCycleType: {
		monthly_fixed: 1200000,
		monthly_variable: 960000,
		irregular_fixed: 480000,
		irregular_variable: 240000,
		unclassified: 0,
	},
	breakdownByBudgetItem: [],
	breakdownByCycleType: [],
};

describe("getExpenseRateLevel", () => {
	it("rate が 0 のとき good を返す", () => {
		expect(getExpenseRateLevel(0)).toBe("good");
	});

	it("rate が 0.5 のとき good を返す", () => {
		expect(getExpenseRateLevel(0.5)).toBe("good");
	});

	it("rate が 0.8 のとき good を返す（境界値: 0.8 以下は good）", () => {
		expect(getExpenseRateLevel(0.8)).toBe("good");
	});

	it("rate が 0.9 のとき warn を返す", () => {
		expect(getExpenseRateLevel(0.9)).toBe("warn");
	});

	it("rate が 1.0 のとき warn を返す（境界値: 1.0 以下は warn）", () => {
		expect(getExpenseRateLevel(1.0)).toBe("warn");
	});

	it("rate が 1.5 のとき alert を返す", () => {
		expect(getExpenseRateLevel(1.5)).toBe("alert");
	});
});

describe("IncomeExpenseSummaryCard", () => {
	it("対象期間が YYYY/MM ～ YYYY/MM 形式で表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("2025/01 ～ 2025/12")).toBeInTheDocument();
	});

	it("period.from が ISO 日付形式（YYYY-MM-DD）でも YYYY/MM 形式で表示される", () => {
		const overview = {
			...baseOverview,
			period: { ...baseOverview.period, from: "2025-01-01", to: "2025-12-31" },
		};
		render(<IncomeExpenseSummaryCard overview={overview} />);
		expect(screen.getByText("2025/01 ～ 2025/12")).toBeInTheDocument();
	});

	it("支出率が四捨五入されてパーセント表示される（80%）", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("支出率が四捨五入されてパーセント表示される（75.6% → 76%）", () => {
		const overview = { ...baseOverview, expenseRate: 0.756 };
		render(<IncomeExpenseSummaryCard overview={overview} />);
		expect(screen.getByText("76%")).toBeInTheDocument();
	});

	it("予算内収入が通貨フォーマットで表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("¥3,600,000")).toBeInTheDocument();
	});

	it("支出が通貨フォーマットで表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("¥2,880,000")).toBeInTheDocument();
	});

	it("rate が 0.8 以下のとき good の評価コメント（✨）が表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText(/✨/)).toBeInTheDocument();
		expect(screen.getByText(/8割以内/)).toBeInTheDocument();
	});

	it("rate が 0.9 のとき warn の評価コメント（⚠️）が表示される", () => {
		const overview = {
			...baseOverview,
			expenseRate: 0.9,
			totalExpense: 3240000,
		};
		render(<IncomeExpenseSummaryCard overview={overview} />);
		expect(screen.getByText(/⚠️/)).toBeInTheDocument();
		expect(screen.getByText(/8〜10割/)).toBeInTheDocument();
	});

	it("rate が 1.2 のとき alert の評価コメント（🚨）が表示される", () => {
		const overview = {
			...baseOverview,
			expenseRate: 1.2,
			totalExpense: 4320000,
		};
		render(<IncomeExpenseSummaryCard overview={overview} />);
		expect(screen.getByText(/🚨/)).toBeInTheDocument();
		expect(screen.getByText(/収入を超えています/)).toBeInTheDocument();
	});

	it("カードタイトル「収支実績」が表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("収支実績")).toBeInTheDocument();
	});

	it("「予算内収入」ラベルが表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("予算内収入")).toBeInTheDocument();
	});

	it("「支出」ラベルが表示される", () => {
		render(<IncomeExpenseSummaryCard overview={baseOverview} />);
		expect(screen.getByText("支出")).toBeInTheDocument();
	});
});
