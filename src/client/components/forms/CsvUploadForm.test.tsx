import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CsvUploadForm } from "./CsvUploadForm"

vi.mock("@/server/actions/import-csv", () => ({
	importCsv: vi.fn(),
}))

describe("CsvUploadForm", () => {
	it("ファイル選択とアップロードボタンが表示される", () => {
		render(<CsvUploadForm />)
		expect(screen.getByLabelText(/CSV/)).toBeInTheDocument()
		expect(screen.getByRole("button", { name: /アップロード/ })).toBeInTheDocument()
	})

	it("ファイル未選択時はアップロードボタンが無効", () => {
		render(<CsvUploadForm />)
		expect(screen.getByRole("button", { name: /アップロード/ })).toBeDisabled()
	})

	it("ファイル選択後にアップロードボタンが有効になる", async () => {
		const user = userEvent.setup()
		render(<CsvUploadForm />)

		const file = new File(["test"], "test.csv", { type: "text/csv" })
		const input = screen.getByLabelText(/CSV/)
		await user.upload(input, file)

		expect(screen.getByRole("button", { name: /アップロード/ })).toBeEnabled()
	})

	it("成功時にインポート件数が表示される", async () => {
		const { importCsv } = await import("@/server/actions/import-csv")
		vi.mocked(importCsv).mockResolvedValue({
			success: true,
			importedCount: 42,
		})

		const user = userEvent.setup()
		render(<CsvUploadForm />)

		const file = new File(["test"], "test.csv", { type: "text/csv" })
		await user.upload(screen.getByLabelText(/CSV/), file)
		await user.click(screen.getByRole("button", { name: /アップロード/ }))

		expect(await screen.findByText(/42件/)).toBeInTheDocument()
	})

	it("エラー時にエラーメッセージが表示される", async () => {
		const { importCsv } = await import("@/server/actions/import-csv")
		vi.mocked(importCsv).mockResolvedValue({
			success: false,
			importedCount: 0,
			error: "ファイルが不正です",
		})

		const user = userEvent.setup()
		render(<CsvUploadForm />)

		const file = new File(["test"], "test.csv", { type: "text/csv" })
		await user.upload(screen.getByLabelText(/CSV/), file)
		await user.click(screen.getByRole("button", { name: /アップロード/ }))

		expect(await screen.findByText(/ファイルが不正です/)).toBeInTheDocument()
	})
})
