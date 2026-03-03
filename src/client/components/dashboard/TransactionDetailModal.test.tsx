import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionDetailModal } from "./TransactionDetailModal";

const mockTransactions = [
	{
		id: "1",
		date: new Date("2025-04-15"),
		description: "東京電力",
		amount: 8500,
		majorCategory: "水道・光熱費",
		minorCategory: "電気代",
		institution: "楽天カード",
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		importHash: "hash1",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "2",
		date: new Date("2025-05-15"),
		description: "東京電力",
		amount: 9200,
		majorCategory: "水道・光熱費",
		minorCategory: "電気代",
		institution: "楽天カード",
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		importHash: "hash2",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

const mockMonthlyTrend = [
	{ month: "2025-04", total: 8500 },
	{ month: "2025-05", total: 9200 },
];

vi.mock("@/server/actions/get-transactions-by-category", () => ({
	getTransactionsByCategory: vi.fn(async () => ({
		success: true,
		data: {
			transactions: mockTransactions,
			monthlyTrend: mockMonthlyTrend,
		},
	})),
}));

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="responsive-container">{children}</div>
	),
	BarChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="bar-chart">{children}</div>
	),
	Bar: () => <div data-testid="bar" />,
	XAxis: () => <div data-testid="x-axis" />,
	YAxis: () => <div data-testid="y-axis" />,
	Tooltip: () => <div data-testid="tooltip" />,
}));

describe("TransactionDetailModal", () => {
	it("モーダルタイトルにカテゴリ名が表示される", async () => {
		render(
			<TransactionDetailModal
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByText("水道・光熱費 / 電気代")).toBeInTheDocument();
	});

	it("取引データが読み込まれ統計が表示される", async () => {
		render(
			<TransactionDetailModal
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText(/合計/)).toBeInTheDocument();
		});
	});

	it("取引一覧が表示される", async () => {
		render(
			<TransactionDetailModal
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(screen.getAllByText("東京電力")).toHaveLength(2);
		});
	});

	it("isOpen=false の場合は何も表示しない", () => {
		render(
			<TransactionDetailModal
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				isOpen={false}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.queryByText("水道・光熱費 / 電気代")).not.toBeInTheDocument();
	});
});
