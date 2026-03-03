import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/client/components/ui/Toast";
import type { BudgetItemWithMappings } from "@/types/budget";
import type { CategoryBreakdown } from "@/types/transaction";
import { BudgetItemCard } from "./BudgetItemCard";

vi.mock("@/server/actions/update-mappings", () => ({
	updateMappings: vi.fn(async () => ({ success: true, data: undefined })),
}));

const mockBudgetItem: BudgetItemWithMappings = {
	id: "1",
	name: "電気代",
	monthlyAmount: 10000,
	cycleType: "monthly_fixed",
	sortOrder: 100,
	createdAt: new Date(),
	updatedAt: new Date(),
	mappings: [
		{
			id: "m1",
			budgetItemId: "1",
			majorCategory: "水道・光熱費",
			minorCategory: "電気代",
			createdAt: new Date(),
		},
	],
};

const mockAllCategories: CategoryBreakdown[] = [
	{ majorCategory: "水道・光熱費", minorCategory: "電気代", total: 50000, count: 6 },
	{ majorCategory: "水道・光熱費", minorCategory: "ガス代", total: 30000, count: 6 },
	{ majorCategory: "食費", minorCategory: "外食", total: 20000, count: 10 },
];

function renderCard(props: Partial<React.ComponentProps<typeof BudgetItemCard>> = {}) {
	return render(
		<ToastProvider>
			<BudgetItemCard
				budgetItem={mockBudgetItem}
				allCategories={mockAllCategories}
				onEdit={vi.fn()}
				{...props}
			/>
		</ToastProvider>,
	);
}

describe("BudgetItemCard", () => {
	it("費目名が表示される", () => {
		renderCard();
		expect(screen.getByText("電気代")).toBeInTheDocument();
	});

	it("月額予算が表示される", () => {
		renderCard();
		expect(screen.getByText(/¥10,000/)).toBeInTheDocument();
	});

	it("マッピング済みカテゴリが選択状態で表示される", () => {
		renderCard();
		const mappedChip = screen.getByText(/水道・光熱費 \/ 電気代/);
		expect(mappedChip.closest("button")?.className).toContain("text-white");
	});

	it("編集ボタンクリックで onEdit が呼ばれる", async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		renderCard({ onEdit });

		await user.click(screen.getByRole("button", { name: /編集/ }));
		expect(onEdit).toHaveBeenCalledWith(mockBudgetItem);
	});
});
