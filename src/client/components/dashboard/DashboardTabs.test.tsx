import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/client/components/ui/Toast";
import { createMockDashboardData } from "@/test/fixtures/mock-dashboard-data";
import { DashboardTabs } from "./DashboardTabs";

vi.mock("@/server/actions/update-mappings", () => ({
	updateMappings: vi.fn(async () => ({ success: true, data: undefined })),
}));

vi.mock("@/server/actions/upsert-budget", () => ({
	upsertBudget: vi.fn(async () => ({ success: true, data: undefined })),
}));

vi.mock("@/server/actions/delete-budget", () => ({
	deleteBudget: vi.fn(async () => ({ success: true, data: undefined })),
}));

vi.mock("@/server/actions/get-transactions-by-category", () => ({
	getTransactionsByCategory: vi.fn(async () => ({
		success: true,
		data: { transactions: [], monthlyTrend: [] },
	})),
}));

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Bar: () => <div />,
	Pie: () => <div />,
	Cell: () => <div />,
	XAxis: () => <div />,
	YAxis: () => <div />,
	CartesianGrid: () => <div />,
	Tooltip: () => <div />,
	Legend: () => <div />,
}));

const mockData = createMockDashboardData();

describe("DashboardTabs", () => {
	it("3つのタブが表示される", () => {
		render(
			<ToastProvider>
				<DashboardTabs dashboardData={mockData} />
			</ToastProvider>,
		);

		expect(screen.getByRole("tab", { name: /サマリー/ })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /予算マッピング/ })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /予算対比レポート/ })).toBeInTheDocument();
	});

	it("デフォルトでサマリータブがアクティブ", () => {
		render(
			<ToastProvider>
				<DashboardTabs dashboardData={mockData} />
			</ToastProvider>,
		);

		const summaryTab = screen.getByRole("tab", { name: /サマリー/ });
		expect(summaryTab).toHaveAttribute("aria-selected", "true");
	});

	it("タブクリックでパネルが切り替わる", async () => {
		const user = userEvent.setup();
		render(
			<ToastProvider>
				<DashboardTabs dashboardData={mockData} />
			</ToastProvider>,
		);

		await user.click(screen.getByRole("tab", { name: /予算マッピング/ }));

		const mappingTab = screen.getByRole("tab", { name: /予算マッピング/ });
		expect(mappingTab).toHaveAttribute("aria-selected", "true");

		const summaryTab = screen.getByRole("tab", { name: /サマリー/ });
		expect(summaryTab).toHaveAttribute("aria-selected", "false");
	});

	it("サマリータブでサマリーパネルが表示される", () => {
		render(
			<ToastProvider>
				<DashboardTabs dashboardData={mockData} />
			</ToastProvider>,
		);

		expect(screen.getByRole("tabpanel")).toBeInTheDocument();
	});
});
