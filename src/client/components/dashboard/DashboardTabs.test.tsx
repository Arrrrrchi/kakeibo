import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { createMockDashboardData } from "@/test/fixtures/mock-dashboard-data"
import { DashboardTabs } from "./DashboardTabs"

const mockData = createMockDashboardData()

describe("DashboardTabs", () => {
	it("3つのタブが表示される", () => {
		render(<DashboardTabs dashboardData={mockData} />)

		expect(screen.getByRole("tab", { name: /サマリー/ })).toBeInTheDocument()
		expect(screen.getByRole("tab", { name: /予算マッピング/ })).toBeInTheDocument()
		expect(screen.getByRole("tab", { name: /予算対比レポート/ })).toBeInTheDocument()
	})

	it("デフォルトでサマリータブがアクティブ", () => {
		render(<DashboardTabs dashboardData={mockData} />)

		const summaryTab = screen.getByRole("tab", { name: /サマリー/ })
		expect(summaryTab).toHaveAttribute("aria-selected", "true")
	})

	it("タブクリックでパネルが切り替わる", async () => {
		const user = userEvent.setup()
		render(<DashboardTabs dashboardData={mockData} />)

		await user.click(screen.getByRole("tab", { name: /予算マッピング/ }))

		const mappingTab = screen.getByRole("tab", { name: /予算マッピング/ })
		expect(mappingTab).toHaveAttribute("aria-selected", "true")

		const summaryTab = screen.getByRole("tab", { name: /サマリー/ })
		expect(summaryTab).toHaveAttribute("aria-selected", "false")
	})

	it("サマリータブでサマリーパネルが表示される", () => {
		render(<DashboardTabs dashboardData={mockData} />)

		expect(screen.getByRole("tabpanel")).toBeInTheDocument()
	})
})
