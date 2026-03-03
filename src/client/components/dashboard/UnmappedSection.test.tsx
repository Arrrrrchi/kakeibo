import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UnmappedSection } from "./UnmappedSection";

describe("UnmappedSection", () => {
	const mockCategories = [
		{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 10 },
		{ majorCategory: "交際費", minorCategory: "飲み会", total: 15000, count: 5 },
	];

	it("未割当カテゴリ数が表示される", () => {
		render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />);
		expect(screen.getByText(/2件/)).toBeInTheDocument();
	});

	it("未割当カテゴリのチップが表示される", () => {
		render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />);
		expect(screen.getByText(/外食/)).toBeInTheDocument();
		expect(screen.getByText(/飲み会/)).toBeInTheDocument();
	});

	it("折りたたみ/展開が動作する", async () => {
		const user = userEvent.setup();
		render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />);

		expect(screen.getByText(/外食/)).toBeVisible();

		const toggle = screen.getByRole("button", { name: /折りたたみ/ });
		await user.click(toggle);

		expect(screen.queryByText(/外食/)).not.toBeInTheDocument();
	});

	it("未割当が 0 件の場合は非表示", () => {
		const { container } = render(
			<UnmappedSection unmappedCategories={[]} onCategoryClick={vi.fn()} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("カテゴリチップクリックで onCategoryClick が呼ばれる", async () => {
		const user = userEvent.setup();
		const onCategoryClick = vi.fn();
		render(
			<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={onCategoryClick} />,
		);

		await user.click(screen.getByText(/外食/));
		expect(onCategoryClick).toHaveBeenCalledWith("食費", "外食");
	});
});
