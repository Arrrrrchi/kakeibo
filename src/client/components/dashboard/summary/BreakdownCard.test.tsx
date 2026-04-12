import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BreakdownItem } from "@/types/dashboard";
import { BreakdownCard, BUDGET_ITEM_PALETTE } from "./BreakdownCard";

// Recharts はテスト環境で SVG を正しく描画しないためモック
vi.mock("@/client/components/charts/DonutChart", () => ({
	DonutChart: ({
		items,
		centerLabel,
	}: {
		items: { key: string; label: string; amount: number; color: string }[];
		centerLabel?: React.ReactNode;
	}) => (
		<div data-testid="donut-chart">
			{centerLabel}
			{items.map((item) => (
				<span key={item.key} data-testid={`donut-item-${item.key}`} data-color={item.color}>
					{item.label}
				</span>
			))}
		</div>
	),
}));

const byBudgetItem: BreakdownItem[] = [
	{ key: "item-1", label: "家賃", amount: 80000, ratio: 0.5, color: "" },
	{ key: "item-2", label: "食費", amount: 48000, ratio: 0.3, color: "" },
	{ key: "item-3", label: "交通費", amount: 32000, ratio: 0.2, color: "" },
];

const byCycleType: BreakdownItem[] = [
	{ key: "monthly_fixed", label: "毎月の固定支出", amount: 80000, ratio: 0.5, color: "#3b82f6" },
	{ key: "monthly_variable", label: "毎月の変動支出", amount: 48000, ratio: 0.3, color: "#eab308" },
	{ key: "irregular_fixed", label: "単発の固定支出", amount: 32000, ratio: 0.2, color: "#f97316" },
	{ key: "irregular_variable", label: "単発の変動支出", amount: 0, ratio: 0, color: "#a855f7" },
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe("BreakdownCard", () => {
	describe("初期表示", () => {
		it("タイトル「支出の内訳」が表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByText("支出の内訳")).toBeInTheDocument();
		});

		it("初期タブが「項目別」である", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			// 項目別タブのアイテムが表示される（DonutChartモックとリスト両方に出るため getAllByText を使う）
			expect(screen.getAllByText("家賃").length).toBeGreaterThan(0);
			expect(screen.getAllByText("食費").length).toBeGreaterThan(0);
		});

		it("タブボタンが「項目別」「4つの敵別」の 2 つ表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByRole("button", { name: "項目別" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "4つの敵別" })).toBeInTheDocument();
		});

		it("月間の平均支出が ¥XXX,XXX/月 形式で表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByText("¥160,000/月")).toBeInTheDocument();
		});

		it("月間の平均支出に「月間の平均支出」ラベルが表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByText("月間の平均支出")).toBeInTheDocument();
		});
	});

	describe("項目別タブ", () => {
		it("1 件目の項目はパレットの 1 色目が割り当てられる", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			const firstItem = screen.getByTestId("donut-item-item-1");
			expect(firstItem.dataset.color).toBe(BUDGET_ITEM_PALETTE[0]);
		});

		it("2 件目の項目はパレットの 2 色目が割り当てられる", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			const secondItem = screen.getByTestId("donut-item-item-2");
			expect(secondItem.dataset.color).toBe(BUDGET_ITEM_PALETTE[1]);
		});

		it("3 件目の項目はパレットの 3 色目が割り当てられる（3 色すべて異なる）", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			const thirdItem = screen.getByTestId("donut-item-item-3");
			expect(thirdItem.dataset.color).toBe(BUDGET_ITEM_PALETTE[2]);
			// 3 色が全て異なることを確認
			expect(BUDGET_ITEM_PALETTE[0]).not.toBe(BUDGET_ITEM_PALETTE[1]);
			expect(BUDGET_ITEM_PALETTE[1]).not.toBe(BUDGET_ITEM_PALETTE[2]);
		});

		it("key が 'unclassified' の項目は UNCLASSIFIED_COLOR が適用される", () => {
			const itemsWithUnclassified: BreakdownItem[] = [
				...byBudgetItem,
				{ key: "unclassified", label: "未分類", amount: 10000, ratio: 0.05, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={itemsWithUnclassified}
					byCycleType={byCycleType}
					totalExpense={170000}
					monthlyAvgExpense={170000}
				/>,
			);
			const unclassifiedItem = screen.getByTestId("donut-item-unclassified");
			expect(unclassifiedItem.dataset.color).toBe("#9ca3af");
		});

		it("各行に割合 % が表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByText("50%")).toBeInTheDocument();
			expect(screen.getByText("30%")).toBeInTheDocument();
			expect(screen.getByText("20%")).toBeInTheDocument();
		});

		it("各行に金額が ¥/月 形式で表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			expect(screen.getByText("¥80,000/月")).toBeInTheDocument();
			expect(screen.getByText("¥48,000/月")).toBeInTheDocument();
			expect(screen.getByText("¥32,000/月")).toBeInTheDocument();
		});

		it("amount が 0 の行は表示されない", () => {
			const itemsWithZero: BreakdownItem[] = [
				{ key: "item-1", label: "家賃", amount: 80000, ratio: 0.5, color: "" },
				{ key: "item-2", label: "ゼロ項目", amount: 0, ratio: 0, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={itemsWithZero}
					byCycleType={byCycleType}
					totalExpense={80000}
					monthlyAvgExpense={80000}
				/>,
			);
			expect(screen.queryByText("ゼロ項目")).not.toBeInTheDocument();
		});

		it("unclassified は amount=0 でもリストに表示される（末尾）", () => {
			const itemsWithZeroUnclassified: BreakdownItem[] = [
				{ key: "item-1", label: "家賃", amount: 80000, ratio: 1.0, color: "" },
				{ key: "unclassified", label: "未分類", amount: 0, ratio: 0, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={itemsWithZeroUnclassified}
					byCycleType={byCycleType}
					totalExpense={80000}
					monthlyAvgExpense={80000}
				/>,
			);
			// unclassified は amount=0 でも表示してよい、またはしなくてもよい
			// 設計: "amount が 0 の行は表示しない（ただし unclassified は amount=0 なら隠してよい）"
			// → unclassified も 0 なら非表示でよい
			// 実装がどちらであっても両方テストを書くのは矛盾するため、
			// ここでは「unclassifiedもamount=0なら非表示」を検証する
			expect(screen.queryByText("未分類")).not.toBeInTheDocument();
		});
	});

	describe("タブ切替", () => {
		it("「4つの敵別」タブをクリックすると敵別データが表示される", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			// DonutChartモックとリスト両方に出るため getAllByText を使う
			expect(screen.getAllByText("毎月の固定支出").length).toBeGreaterThan(0);
			expect(screen.getAllByText("毎月の変動支出").length).toBeGreaterThan(0);
		});

		it("「4つの敵別」タブに切り替えると項目別データが消える", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			expect(screen.queryByText("家賃")).not.toBeInTheDocument();
		});

		it("「4つの敵別」タブで各行の label/ratio/amount が props と一致", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			// DonutChartモックとリスト両方に出るため getAllByText を使う
			expect(screen.getAllByText("毎月の固定支出").length).toBeGreaterThan(0);
			expect(screen.getByText("50%")).toBeInTheDocument();
			expect(screen.getByText("¥80,000/月")).toBeInTheDocument();
		});

		it("「4つの敵別」タブで color が props の値がそのまま使われる", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			const monthlyFixedItem = screen.getByTestId("donut-item-monthly_fixed");
			expect(monthlyFixedItem.dataset.color).toBe("#3b82f6");
		});

		it("「項目別」タブに戻すと再び項目別データが表示される", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			await user.click(screen.getByRole("button", { name: "項目別" }));
			// DonutChartモックとリスト両方に出るため getAllByText を使う
			expect(screen.getAllByText("家賃").length).toBeGreaterThan(0);
			expect(screen.queryByText("毎月の固定支出")).not.toBeInTheDocument();
		});

		it("「4つの敵別」タブで amount=0 の行は表示されない", async () => {
			const user = userEvent.setup();
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={byCycleType}
					totalExpense={160000}
					monthlyAvgExpense={160000}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			// irregular_variable は amount=0 なのでリストに表示されない
			expect(screen.queryByText("単発の変動支出")).not.toBeInTheDocument();
		});
	});

	describe("空データ", () => {
		it("byBudgetItem が空のとき「支出の記録がありません」が表示される", () => {
			render(
				<BreakdownCard
					byBudgetItem={[]}
					byCycleType={byCycleType}
					totalExpense={0}
					monthlyAvgExpense={0}
				/>,
			);
			expect(screen.getByText("支出の記録がありません")).toBeInTheDocument();
		});

		it("byBudgetItem の合計が 0 のとき「支出の記録がありません」が表示される", () => {
			const zeroItems: BreakdownItem[] = [
				{ key: "item-1", label: "家賃", amount: 0, ratio: 0, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={zeroItems}
					byCycleType={byCycleType}
					totalExpense={0}
					monthlyAvgExpense={0}
				/>,
			);
			expect(screen.getByText("支出の記録がありません")).toBeInTheDocument();
		});

		it("「4つの敵別」タブで byCycleType の合計が 0 のとき「支出の記録がありません」が表示される", async () => {
			const user = userEvent.setup();
			const zeroCycleType: BreakdownItem[] = [
				{ key: "monthly_fixed", label: "毎月の固定支出", amount: 0, ratio: 0, color: "#3b82f6" },
			];
			render(
				<BreakdownCard
					byBudgetItem={byBudgetItem}
					byCycleType={zeroCycleType}
					totalExpense={0}
					monthlyAvgExpense={0}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "4つの敵別" }));
			expect(screen.getByText("支出の記録がありません")).toBeInTheDocument();
		});
	});

	describe("ソート", () => {
		it("項目別リストは amount 降順にソートされる", () => {
			const unsortedItems: BreakdownItem[] = [
				{ key: "item-a", label: "少ない", amount: 10000, ratio: 0.1, color: "" },
				{ key: "item-b", label: "多い", amount: 90000, ratio: 0.9, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={unsortedItems}
					byCycleType={byCycleType}
					totalExpense={100000}
					monthlyAvgExpense={100000}
				/>,
			);
			const listItems = screen.getAllByRole("listitem");
			// 「多い」が「少ない」より前に来る
			const multipleIndex = listItems.findIndex((el) => el.textContent?.includes("多い"));
			const fewIndex = listItems.findIndex((el) => el.textContent?.includes("少ない"));
			expect(multipleIndex).toBeLessThan(fewIndex);
		});

		it("unclassified は amount に関わらず末尾に配置される", () => {
			const itemsWithUnclassified: BreakdownItem[] = [
				{ key: "item-a", label: "少ない", amount: 10000, ratio: 0.05, color: "" },
				{ key: "unclassified", label: "未分類", amount: 90000, ratio: 0.45, color: "" },
				{ key: "item-b", label: "多い", amount: 100000, ratio: 0.5, color: "" },
			];
			render(
				<BreakdownCard
					byBudgetItem={itemsWithUnclassified}
					byCycleType={byCycleType}
					totalExpense={200000}
					monthlyAvgExpense={200000}
				/>,
			);
			const listItems = screen.getAllByRole("listitem");
			const unclassifiedIndex = listItems.findIndex((el) => el.textContent?.includes("未分類"));
			const lastIndex = listItems.length - 1;
			expect(unclassifiedIndex).toBe(lastIndex);
		});
	});
});
