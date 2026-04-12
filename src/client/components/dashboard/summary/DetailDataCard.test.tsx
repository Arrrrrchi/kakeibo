import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DashboardOverview } from "@/types/dashboard";
import { DetailDataCard } from "./DetailDataCard";

const baseOverview: DashboardOverview = {
	period: { from: "2025-01", to: "2025-12", monthCount: 12 },
	totalIncome: 3600000,
	totalExpense: 2880000,
	totalInvestment: 360000,
	mappedIncome: 3000000,
	unmappedIncome: 600000,
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

describe("DetailDataCard", () => {
	describe("カードタイトル", () => {
		it("「詳細データ」タイトルが表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("詳細データ")).toBeInTheDocument();
		});
	});

	describe("セクション1: 総収入", () => {
		it("「総収入」ラベルと合計金額が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("総収入")).toBeInTheDocument();
			// totalIncome = 3,600,000
			const amounts = screen.getAllByText("¥3,600,000");
			expect(amounts.length).toBeGreaterThanOrEqual(1);
		});

		it("「予算内収入」ラベルと金額が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("予算内収入")).toBeInTheDocument();
			expect(screen.getByText("¥3,000,000")).toBeInTheDocument();
		});

		it("「予算外収入」ラベルと金額が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("予算外収入")).toBeInTheDocument();
			expect(screen.getByText("¥600,000")).toBeInTheDocument();
		});
	});

	describe("セクション2: 総支出", () => {
		it("「総支出」ラベルと合計金額が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("総支出")).toBeInTheDocument();
			// totalExpense = 2,880,000
			const amounts = screen.getAllByText("¥2,880,000");
			expect(amounts.length).toBeGreaterThanOrEqual(1);
		});

		it("毎月の固定支出が byCycleType から正しく表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("毎月の固定支出")).toBeInTheDocument();
			expect(screen.getByText("¥1,200,000")).toBeInTheDocument();
		});

		it("毎月の変動支出が byCycleType から正しく表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("毎月の変動支出")).toBeInTheDocument();
			expect(screen.getByText("¥960,000")).toBeInTheDocument();
		});

		it("単発の固定支出が byCycleType から正しく表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("単発の固定支出")).toBeInTheDocument();
			expect(screen.getByText("¥480,000")).toBeInTheDocument();
		});

		it("単発の変動支出が byCycleType から正しく表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("単発の変動支出")).toBeInTheDocument();
			expect(screen.getByText("¥240,000")).toBeInTheDocument();
		});

		it("未分類が amount === 0 のとき「未分類」行が表示されない", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.queryByText("未分類")).not.toBeInTheDocument();
		});

		it("未分類が amount > 0 のとき「未分類」行が表示される", () => {
			const overview: DashboardOverview = {
				...baseOverview,
				byCycleType: {
					...baseOverview.byCycleType,
					unclassified: 120000,
				},
			};
			render(<DetailDataCard overview={overview} />);
			expect(screen.getByText("未分類")).toBeInTheDocument();
			expect(screen.getByText("¥120,000")).toBeInTheDocument();
		});
	});

	describe("セクション3: 総投資 + 貯蓄", () => {
		it("「総投資」ラベルと金額が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("総投資")).toBeInTheDocument();
			// totalInvestment = 360,000。同額が複数存在する可能性があるため getAllByText で確認
			const amounts = screen.getAllByText("¥360,000");
			expect(amounts.length).toBeGreaterThanOrEqual(1);
		});

		it("「支出率」がパーセント表示される", () => {
			// expenseRate = 0.8 → 80%
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("支出率")).toBeInTheDocument();
			expect(screen.getByText("80%")).toBeInTheDocument();
		});

		it("「貯金額」が表示される（totalIncome - totalExpense - totalInvestment）", () => {
			// 3,600,000 - 2,880,000 - 360,000 = 360,000
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("貯金額")).toBeInTheDocument();
		});

		it("「貯金・投資合計」が表示される", () => {
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("貯金・投資合計")).toBeInTheDocument();
		});

		it("「貯蓄率」がパーセント表示される", () => {
			// savingsRate = 0.1 → 10%
			render(<DetailDataCard overview={baseOverview} />);
			expect(screen.getByText("貯蓄率")).toBeInTheDocument();
			expect(screen.getByText("10%")).toBeInTheDocument();
		});

		it("貯金額が正の場合に赤色クラスが付かない", () => {
			// savings = 3,600,000 - 2,880,000 - 360,000 = 360,000 (正)
			render(<DetailDataCard overview={baseOverview} />);
			const savingsEl = screen.getByTestId("savings-amount");
			expect(savingsEl).not.toHaveClass("text-red-500");
		});

		it("貯金額が負の場合に赤色クラスが付く", () => {
			const overview: DashboardOverview = {
				...baseOverview,
				totalIncome: 1000000,
				totalExpense: 900000,
				totalInvestment: 200000,
				// savings = 1,000,000 - 900,000 - 200,000 = -100,000（負）
			};
			render(<DetailDataCard overview={overview} />);
			const savingsEl = screen.getByTestId("savings-amount");
			expect(savingsEl).toHaveClass("text-red-500");
		});

		it("貯蓄率が正の場合に赤色クラスが付かない", () => {
			// savingsRate = 0.1（正）
			render(<DetailDataCard overview={baseOverview} />);
			const savingsRateEl = screen.getByTestId("savings-rate");
			expect(savingsRateEl).not.toHaveClass("text-red-500");
		});

		it("貯蓄率が負の場合に赤色クラスが付く", () => {
			const overview: DashboardOverview = {
				...baseOverview,
				savingsRate: -0.1,
			};
			render(<DetailDataCard overview={overview} />);
			const savingsRateEl = screen.getByTestId("savings-rate");
			expect(savingsRateEl).toHaveClass("text-red-500");
		});
	});
});
