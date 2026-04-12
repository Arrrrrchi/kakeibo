import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";
import { EditableTransactionRow } from "./EditableTransactionRow";

vi.mock("@/server/actions/update-transaction", () => ({
	updateTransaction: vi.fn(),
}));
vi.mock("@/server/actions/delete-transaction", () => ({
	deleteTransaction: vi.fn(),
}));

import { deleteTransaction } from "@/server/actions/delete-transaction";
import { updateTransaction } from "@/server/actions/update-transaction";

const mockTransaction: Transaction = {
	id: "tx-1",
	date: new Date("2026-03-01"),
	description: "スーパー",
	amount: 1500,
	majorCategory: "食費",
	minorCategory: "外食",
	institution: null,
	memo: null,
	moneyforwardId: null,
	isIncome: false,
	isTransfer: false,
	importHash: "hash1",
	createdAt: new Date(),
	updatedAt: new Date(),
};

const categoryOptions = [
	{ majorCategory: "食費", minorCategory: "外食" },
	{ majorCategory: "食費", minorCategory: "自炊" },
	{ majorCategory: "水道・光熱費", minorCategory: "電気代" },
];

function renderRow(overrides?: Partial<Transaction>) {
	const onUpdated = vi.fn();
	const onDeleted = vi.fn();
	const transaction = { ...mockTransaction, ...overrides };
	const result = render(
		<table>
			<tbody>
				<EditableTransactionRow
					transaction={transaction}
					categoryOptions={categoryOptions}
					onUpdated={onUpdated}
					onDeleted={onDeleted}
				/>
			</tbody>
		</table>,
	);
	return { ...result, onUpdated, onDeleted };
}

describe("EditableTransactionRow", () => {
	beforeEach(() => vi.clearAllMocks());

	it("取引の内容（description）が表示される", () => {
		renderRow();
		expect(screen.getByText("スーパー")).toBeInTheDocument();
	});

	it("金額が表示される", () => {
		renderRow();
		expect(screen.getByText("1500")).toBeInTheDocument();
	});

	it("内容セルをクリックすると input が表示される", async () => {
		const user = userEvent.setup();
		renderRow();

		await user.click(screen.getByText("スーパー"));

		expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
	});

	it("input で編集して blur すると updateTransaction が呼ばれ onUpdated が呼ばれる", async () => {
		const user = userEvent.setup();
		const updatedTx: Transaction = { ...mockTransaction, description: "コンビニ" };
		vi.mocked(updateTransaction).mockResolvedValue({ success: true, data: updatedTx });

		const { onUpdated } = renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "コンビニ");
		await user.tab();

		await waitFor(() => {
			expect(updateTransaction).toHaveBeenCalledWith(
				"tx-1",
				expect.objectContaining({ description: "コンビニ" }),
			);
		});
		await waitFor(() => {
			expect(onUpdated).toHaveBeenCalledWith(updatedTx);
		});
	});

	it("updateTransaction が失敗したとき元の値に戻る", async () => {
		const user = userEvent.setup();
		vi.mocked(updateTransaction).mockResolvedValue({
			success: false,
			error: "更新に失敗しました",
		});

		renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "失敗する内容");
		await user.tab();

		await waitFor(() => {
			expect(screen.getByText("スーパー")).toBeInTheDocument();
		});
	});

	it("削除ボタンをクリックして confirm=true なら deleteTransaction が呼ばれ onDeleted が呼ばれる", async () => {
		const user = userEvent.setup();
		vi.spyOn(window, "confirm").mockReturnValue(true);
		vi.mocked(deleteTransaction).mockResolvedValue({ success: true, data: undefined });

		const { onDeleted } = renderRow();

		await user.click(screen.getByRole("button", { name: /削除/i }));

		await waitFor(() => {
			expect(deleteTransaction).toHaveBeenCalledWith("tx-1");
		});
		await waitFor(() => {
			expect(onDeleted).toHaveBeenCalledWith("tx-1");
		});
	});

	it("削除ボタンをクリックして confirm=false なら deleteTransaction が呼ばれない", async () => {
		const user = userEvent.setup();
		vi.spyOn(window, "confirm").mockReturnValue(false);

		renderRow();

		await user.click(screen.getByRole("button", { name: /削除/i }));

		expect(deleteTransaction).not.toHaveBeenCalled();
	});

	it("保存中は行が aria-busy='true' になる", async () => {
		const user = userEvent.setup();
		let resolveUpdate!: (value: { success: true; data: Transaction }) => void;
		vi.mocked(updateTransaction).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveUpdate = resolve;
				}),
		);

		renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "コンビニ");
		await user.tab();

		await waitFor(() => {
			expect(screen.getByRole("row")).toHaveAttribute("aria-busy", "true");
		});

		await act(async () => {
			resolveUpdate({ success: true, data: { ...mockTransaction, description: "コンビニ" } });
		});
	});

	it("handleSave が throw したとき isSaving が false になる", async () => {
		const user = userEvent.setup();
		vi.mocked(updateTransaction).mockRejectedValue(new Error("ネットワークエラー"));

		renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "コンビニ");
		await user.tab();

		await waitFor(() => {
			expect(screen.getByRole("row")).not.toHaveAttribute("aria-busy", "true");
		});
	});

	it("amount に数値以外を入力したとき updateTransaction が呼ばれない", async () => {
		const user = userEvent.setup();

		renderRow();

		await user.click(screen.getByText("1500"));
		const input = screen.getByRole("textbox", { name: /amount/i });
		await user.clear(input);
		await user.type(input, "abc");
		await user.tab();

		await waitFor(() => {
			expect(updateTransaction).not.toHaveBeenCalled();
		});
	});

	it("memo（multiline）セルで Enter キーを押しても commit されない", async () => {
		const user = userEvent.setup();
		vi.mocked(updateTransaction).mockResolvedValue({
			success: true,
			data: { ...mockTransaction, memo: "テストメモ" },
		});

		renderRow({ memo: "既存メモ" });

		await user.click(screen.getByText("既存メモ"));
		const textarea = screen.getByRole("textbox", { name: /memo/i });
		await user.clear(textarea);
		await user.type(textarea, "テストメモ");
		await user.keyboard("{Enter}");

		// Enter キーでは updateTransaction は呼ばれない
		expect(updateTransaction).not.toHaveBeenCalled();
	});

	it("保存中は EditableCell の button が disabled になる", async () => {
		const user = userEvent.setup();
		let resolveUpdate!: (value: { success: true; data: Transaction }) => void;
		vi.mocked(updateTransaction).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveUpdate = resolve;
				}),
		);

		renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "コンビニ");
		await user.tab();

		await waitFor(() => {
			// isSaving 中は amount ボタンが disabled になっている
			const amountButton = screen.getByText("1500").closest("button");
			expect(amountButton).toBeDisabled();
		});

		await act(async () => {
			resolveUpdate({ success: true, data: { ...mockTransaction, description: "コンビニ" } });
		});
	});

	it("エラーメッセージが description セル内に role=alert で表示される", async () => {
		const user = userEvent.setup();
		vi.mocked(updateTransaction).mockResolvedValue({
			success: false,
			error: "更新に失敗しました",
		});

		renderRow();

		await user.click(screen.getByText("スーパー"));
		const input = screen.getByRole("textbox", { name: /description/i });
		await user.clear(input);
		await user.type(input, "失敗する内容");
		await user.tab();

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveTextContent("更新に失敗しました");
		});
	});
});
