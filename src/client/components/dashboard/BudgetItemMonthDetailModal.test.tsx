import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";
import { BudgetItemMonthDetailModal } from "./BudgetItemMonthDetailModal";

vi.mock("@/server/actions/update-transaction", () => ({
	updateTransaction: vi.fn(),
}));
vi.mock("@/server/actions/delete-transaction", () => ({
	deleteTransaction: vi.fn(),
}));

import { deleteTransaction } from "@/server/actions/delete-transaction";
import { updateTransaction } from "@/server/actions/update-transaction";

const mockTransactions: Transaction[] = [
	{
		id: "tx-1",
		date: new Date("2026-03-05"),
		description: "スーパー",
		amount: 1500,
		majorCategory: "食費",
		minorCategory: "外食",
		institution: "三菱UFJ",
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		isTransfer: false,
		importHash: "hash1",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "tx-2",
		date: new Date("2026-03-10"),
		description: "電気代",
		amount: 8000,
		majorCategory: "水道・光熱費",
		minorCategory: "電気代",
		institution: null,
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		isTransfer: false,
		importHash: "hash2",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

const categoryOptions = [
	{ majorCategory: "食費", minorCategory: "外食" },
	{ majorCategory: "水道・光熱費", minorCategory: "電気代" },
];

const defaultProps = {
	budgetItemName: "食費",
	mappings: [{ majorCategory: "食費", minorCategory: "外食" }],
	month: "2026-03",
	categoryOptions,
	onClose: vi.fn(),
};

describe("BudgetItemMonthDetailModal", () => {
	beforeEach(() => vi.clearAllMocks());

	it("取引一覧がロードされて表示される", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () =>
					mockTransactions.map((t) => ({
						...t,
						date: t.date.toISOString(),
						createdAt: t.createdAt.toISOString(),
						updatedAt: t.updatedAt.toISOString(),
					})),
			}),
		);

		render(<BudgetItemMonthDetailModal {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText("スーパー")).toBeInTheDocument();
		});
		// 「電気代」は description と minorCategory の両方に現れるので複数あることを確認
		expect(screen.getAllByText("電気代").length).toBeGreaterThanOrEqual(1);
	});

	it("合計金額が表示される", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () =>
					mockTransactions.map((t) => ({
						...t,
						date: t.date.toISOString(),
						createdAt: t.createdAt.toISOString(),
						updatedAt: t.updatedAt.toISOString(),
					})),
			}),
		);

		render(<BudgetItemMonthDetailModal {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText("¥9,500")).toBeInTheDocument();
		});
	});

	it("取引を削除すると合計金額が再計算される", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () =>
					mockTransactions.map((t) => ({
						...t,
						date: t.date.toISOString(),
						createdAt: t.createdAt.toISOString(),
						updatedAt: t.updatedAt.toISOString(),
					})),
			}),
		);
		vi.mocked(deleteTransaction).mockResolvedValue({ success: true, data: undefined });
		vi.spyOn(window, "confirm").mockReturnValue(true);

		render(<BudgetItemMonthDetailModal {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText("スーパー")).toBeInTheDocument();
		});

		// 最初の行の削除ボタンをクリック（tx-1: ¥1500）
		const deleteButtons = screen.getAllByRole("button", { name: /削除/i });
		await userEvent.click(deleteButtons[0]);

		await waitFor(() => {
			// スーパーが消えている
			expect(screen.queryByText("スーパー")).not.toBeInTheDocument();
		});
		// 合計が ¥8,000 になる
		expect(screen.getByText("¥8,000")).toBeInTheDocument();
	});

	it("取引を編集すると合計金額が再計算される", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () =>
					mockTransactions.map((t) => ({
						...t,
						date: t.date.toISOString(),
						createdAt: t.createdAt.toISOString(),
						updatedAt: t.updatedAt.toISOString(),
					})),
			}),
		);
		const updatedTx: Transaction = { ...mockTransactions[0], amount: 3000 };
		vi.mocked(updateTransaction).mockResolvedValue({ success: true, data: updatedTx });

		render(<BudgetItemMonthDetailModal {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText("1500")).toBeInTheDocument();
		});

		// amount セルをクリックして編集
		await userEvent.click(screen.getByText("1500"));
		const input = screen.getByRole("textbox", { name: /amount/i });
		await userEvent.clear(input);
		await userEvent.type(input, "3000");
		await userEvent.tab();

		await waitFor(() => {
			// 合計が ¥11,000 になる（3000 + 8000）
			expect(screen.getByText("¥11,000")).toBeInTheDocument();
		});
	});

	it("fetch が失敗した場合エラーメッセージが表示される", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: "取引データの取得に失敗しました" }),
			}),
		);

		render(<BudgetItemMonthDetailModal {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText("取引データの取得に失敗しました")).toBeInTheDocument();
		});
	});

	it("アンマウント時に fetch が abort される", async () => {
		const abortSpy = vi.spyOn(AbortController.prototype, "abort");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockReturnValue(new Promise(() => {})), // 永遠に pending
		);

		const { unmount } = render(<BudgetItemMonthDetailModal {...defaultProps} />);
		unmount();

		expect(abortSpy).toHaveBeenCalledTimes(1);
	});

	it("mappings/month が変わったとき前の fetch が abort される", async () => {
		const abortSpy = vi.spyOn(AbortController.prototype, "abort");
		const fetchMock = vi.fn().mockReturnValue(new Promise(() => {})); // 永遠に pending
		vi.stubGlobal("fetch", fetchMock);

		const { rerender } = render(<BudgetItemMonthDetailModal {...defaultProps} />);

		// rerender 前: fetch が 1 回呼ばれている
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// month を変更して再レンダリング
		rerender(<BudgetItemMonthDetailModal {...defaultProps} month="2026-04" />);

		// 前の effect のクリーンアップで abort が呼ばれ、新しい fetch が発火する
		expect(abortSpy).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
