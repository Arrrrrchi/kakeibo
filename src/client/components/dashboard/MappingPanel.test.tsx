import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ToastProvider } from "@/client/components/ui/Toast"
import type { BudgetItemWithMappings } from "@/types/budget"
import type { CategoryBreakdown } from "@/types/transaction"
import { MappingPanel } from "./MappingPanel"

vi.mock("@/server/actions/update-mappings", () => ({
	updateMappings: vi.fn(async () => ({ success: true, data: undefined })),
}))

vi.mock("@/server/actions/upsert-budget", () => ({
	upsertBudget: vi.fn(async () => ({ success: true, data: undefined })),
}))

vi.mock("@/server/actions/delete-budget", () => ({
	deleteBudget: vi.fn(async () => ({ success: true, data: undefined })),
}))

vi.mock("@/server/actions/get-transactions-by-category", () => ({
	getTransactionsByCategory: vi.fn(async () => ({
		success: true,
		data: { transactions: [], monthlyTrend: [] },
	})),
}))

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Bar: () => <div />,
	XAxis: () => <div />,
	YAxis: () => <div />,
	Tooltip: () => <div />,
}))

const mockBudgetItems: BudgetItemWithMappings[] = [
	{
		id: "1",
		name: "電気代",
		monthlyAmount: 10000,
		cycleType: "monthly_fixed",
		sortOrder: 100,
		createdAt: new Date(),
		updatedAt: new Date(),
		mappings: [],
	},
	{
		id: "2",
		name: "食費",
		monthlyAmount: 30000,
		cycleType: "monthly_variable",
		sortOrder: 200,
		createdAt: new Date(),
		updatedAt: new Date(),
		mappings: [],
	},
]

const mockCategories: CategoryBreakdown[] = [
	{ majorCategory: "水道・光熱費", minorCategory: "電気代", total: 50000, count: 6 },
]

const mockUnmappedCategories: CategoryBreakdown[] = [
	{ majorCategory: "食費", minorCategory: "外食", total: 20000, count: 10 },
]

function renderPanel(props: Partial<React.ComponentProps<typeof MappingPanel>> = {}) {
	return render(
		<ToastProvider>
			<MappingPanel
				budgetItems={mockBudgetItems}
				allCategories={mockCategories}
				unmappedCategories={mockUnmappedCategories}
				{...props}
			/>
		</ToastProvider>,
	)
}

describe("MappingPanel", () => {
	it("周期タイプごとのセクションヘッダーが表示される", () => {
		renderPanel()
		expect(screen.getByText("毎月・固定")).toBeInTheDocument()
		expect(screen.getByText("毎月・変動")).toBeInTheDocument()
	})

	it("予算項目が表示される", () => {
		renderPanel()
		expect(screen.getByText("電気代")).toBeInTheDocument()
		expect(screen.getByText("食費")).toBeInTheDocument()
	})

	it("未割当セクションが表示される", () => {
		renderPanel()
		expect(screen.getByText(/未割当のカテゴリ/)).toBeInTheDocument()
	})

	it("「予算を追加」ボタンが表示される", () => {
		renderPanel({ unmappedCategories: [] })
		expect(screen.getByRole("button", { name: /予算を追加/ })).toBeInTheDocument()
	})

	it("「予算を追加」クリックでモーダルが開く", async () => {
		const user = userEvent.setup()
		renderPanel({ unmappedCategories: [] })

		await user.click(screen.getByRole("button", { name: /予算を追加/ }))
		expect(screen.getByText("予算項目の追加")).toBeInTheDocument()
	})

	it("予算項目が空の場合もセクションが表示される", () => {
		renderPanel({ budgetItems: [], unmappedCategories: [] })
		expect(screen.getByRole("button", { name: /予算を追加/ })).toBeInTheDocument()
	})
})
