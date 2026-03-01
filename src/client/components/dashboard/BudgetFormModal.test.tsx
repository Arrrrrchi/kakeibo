import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ToastProvider } from "@/client/components/ui/Toast"
import { BudgetFormModal } from "./BudgetFormModal"

vi.mock("@/server/actions/upsert-budget", () => ({
	upsertBudget: vi.fn(async () => ({ success: true, data: undefined })),
}))

vi.mock("@/server/actions/delete-budget", () => ({
	deleteBudget: vi.fn(async () => ({ success: true, data: undefined })),
}))

function renderModal(props: Partial<React.ComponentProps<typeof BudgetFormModal>> = {}) {
	return render(
		<ToastProvider>
			<BudgetFormModal isOpen={true} onClose={vi.fn()} {...props} />
		</ToastProvider>,
	)
}

describe("BudgetFormModal", () => {
	describe("新規作成モード", () => {
		it("タイトルが「予算項目の追加」", () => {
			renderModal()
			expect(screen.getByText("予算項目の追加")).toBeInTheDocument()
		})

		it("削除ボタンが非表示", () => {
			renderModal()
			expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument()
		})

		it("フォームが空の状態で表示される", () => {
			renderModal()
			expect(screen.getByLabelText(/費目名/)).toHaveValue("")
			expect(screen.getByLabelText(/月額予算/)).toHaveValue(null)
		})
	})

	describe("編集モード", () => {
		const mockBudgetItem = {
			id: "1",
			name: "電気代",
			monthlyAmount: 10000,
			cycleType: "monthly_fixed" as const,
			sortOrder: 100,
			createdAt: new Date(),
			updatedAt: new Date(),
			mappings: [],
		}

		it("タイトルが「予算項目の編集」", () => {
			renderModal({ budgetItem: mockBudgetItem })
			expect(screen.getByText("予算項目の編集")).toBeInTheDocument()
		})

		it("既存値がフォームに初期表示される", () => {
			renderModal({ budgetItem: mockBudgetItem })
			expect(screen.getByLabelText(/費目名/)).toHaveValue("電気代")
			expect(screen.getByLabelText(/月額予算/)).toHaveValue(10000)
		})

		it("削除ボタンが表示される", () => {
			renderModal({ budgetItem: mockBudgetItem })
			expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument()
		})
	})

	describe("バリデーション", () => {
		it("費目名が空で送信するとエラー表示", async () => {
			const user = userEvent.setup()
			renderModal()

			await user.click(screen.getByRole("button", { name: /保存/ }))

			expect(screen.getByLabelText(/費目名/)).toBeInvalid()
		})
	})

	it("isOpen=false の場合は何も表示しない", () => {
		render(
			<ToastProvider>
				<BudgetFormModal isOpen={false} onClose={vi.fn()} />
			</ToastProvider>,
		)
		expect(screen.queryByText("予算項目の追加")).not.toBeInTheDocument()
	})

	it("キャンセルボタンで onClose が呼ばれる", async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderModal({ onClose })

		await user.click(screen.getByRole("button", { name: /キャンセル/ }))
		expect(onClose).toHaveBeenCalledOnce()
	})
})
