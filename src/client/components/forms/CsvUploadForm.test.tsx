import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/client/components/ui/Toast";
import { CsvUploadForm } from "./CsvUploadForm";

vi.mock("@/server/actions/import-csv", () => ({
	importCsvFiles: vi.fn(),
}));

function renderWithToast() {
	return render(
		<ToastProvider>
			<CsvUploadForm />
		</ToastProvider>,
	);
}

describe("CsvUploadForm", () => {
	it("ファイル選択とアップロードボタンが表示される", () => {
		renderWithToast();
		expect(screen.getByLabelText(/CSV/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /アップロード/ })).toBeInTheDocument();
	});

	it("ファイル未選択時はアップロードボタンが無効", () => {
		renderWithToast();
		expect(screen.getByRole("button", { name: /アップロード/ })).toBeDisabled();
	});

	it("複数ファイル選択で一覧が表示される", async () => {
		const user = userEvent.setup();
		renderWithToast();

		const file1 = new File(["data1"], "2025-04.csv", { type: "text/csv" });
		const file2 = new File(["data2"], "2025-05.csv", { type: "text/csv" });
		const input = screen.getByLabelText(/CSV/);
		await user.upload(input, [file1, file2]);

		expect(screen.getByText("2025-04.csv")).toBeInTheDocument();
		expect(screen.getByText("2025-05.csv")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /アップロード/ })).toBeEnabled();
	});

	it("ファイル削除ボタンで一覧から除外される", async () => {
		const user = userEvent.setup();
		renderWithToast();

		const file1 = new File(["data1"], "2025-04.csv", { type: "text/csv" });
		const file2 = new File(["data2"], "2025-05.csv", { type: "text/csv" });
		await user.upload(screen.getByLabelText(/CSV/), [file1, file2]);

		const item = screen.getByText("2025-04.csv").closest("li");
		if (!item) throw new Error("li element not found");
		await user.click(within(item).getByRole("button", { name: /削除/ }));

		expect(screen.queryByText("2025-04.csv")).not.toBeInTheDocument();
		expect(screen.getByText("2025-05.csv")).toBeInTheDocument();
	});

	it("成功時にファイルごとの結果が表示される", async () => {
		const { importCsvFiles } = await import("@/server/actions/import-csv");
		vi.mocked(importCsvFiles).mockResolvedValue({
			success: true,
			data: {
				totalImported: 10,
				fileResults: [
					{ fileName: "2025-04.csv", success: true, importedCount: 6 },
					{ fileName: "2025-05.csv", success: true, importedCount: 4 },
				],
			},
		});

		const user = userEvent.setup();
		renderWithToast();

		const file = new File(["test"], "test.csv", { type: "text/csv" });
		await user.upload(screen.getByLabelText(/CSV/), file);
		await user.click(screen.getByRole("button", { name: /アップロード/ }));

		expect(await screen.findByText(/10件/)).toBeInTheDocument();
	});

	it("部分成功時にファイルごとの結果が表示される", async () => {
		const { importCsvFiles } = await import("@/server/actions/import-csv");
		vi.mocked(importCsvFiles).mockResolvedValue({
			success: true,
			data: {
				totalImported: 4,
				fileResults: [
					{
						fileName: "bad.csv",
						success: false,
						error: "インポートできるデータがありませんでした",
					},
					{ fileName: "good.csv", success: true, importedCount: 4 },
				],
			},
		});

		const user = userEvent.setup();
		renderWithToast();

		const file = new File(["test"], "test.csv", { type: "text/csv" });
		await user.upload(screen.getByLabelText(/CSV/), file);
		await user.click(screen.getByRole("button", { name: /アップロード/ }));

		expect(await screen.findByText(/good.csv/)).toBeInTheDocument();
		expect(screen.getByText(/bad.csv/)).toBeInTheDocument();
		expect(screen.getByText(/インポートできるデータがありませんでした/)).toBeInTheDocument();
	});

	it("エラー時にエラーメッセージが表示される", async () => {
		const { importCsvFiles } = await import("@/server/actions/import-csv");
		vi.mocked(importCsvFiles).mockResolvedValue({
			success: false,
			error: "ファイルが不正です",
		});

		const user = userEvent.setup();
		renderWithToast();

		const file = new File(["test"], "test.csv", { type: "text/csv" });
		await user.upload(screen.getByLabelText(/CSV/), file);
		await user.click(screen.getByRole("button", { name: /アップロード/ }));

		expect(await screen.findByText(/ファイルが不正です/)).toBeInTheDocument();
	});
});
