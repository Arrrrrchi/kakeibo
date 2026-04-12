import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DonutChart } from "./DonutChart";

const mockItems = [
	{ key: "food", label: "食費", amount: 30000, color: "#3b82f6" },
	{ key: "housing", label: "住宅", amount: 80000, color: "#ef4444" },
	{ key: "transport", label: "交通費", amount: 10000, color: "#22c55e" },
];

describe("DonutChart", () => {
	it("items を 3 件渡してもクラッシュしない（smoke test）", () => {
		expect(() => {
			render(<DonutChart items={mockItems} />);
		}).not.toThrow();
	});

	it("空配列を渡すと「データなし」テキストが描画される", () => {
		render(<DonutChart items={[]} />);
		expect(screen.getByText("データなし")).toBeInTheDocument();
	});

	it("合計が 0 の items を渡すと「データなし」テキストが描画される", () => {
		const zeroItems = mockItems.map((item) => ({ ...item, amount: 0 }));
		render(<DonutChart items={zeroItems} />);
		expect(screen.getByText("データなし")).toBeInTheDocument();
	});

	it("centerLabel に渡した要素が描画される", () => {
		render(<DonutChart items={mockItems} centerLabel={<span>¥120,000</span>} />);
		expect(screen.getByText("¥120,000")).toBeInTheDocument();
	});

	it("空配列のとき centerLabel より「データなし」が優先される", () => {
		render(<DonutChart items={[]} centerLabel={<span>¥0</span>} />);
		expect(screen.getByText("データなし")).toBeInTheDocument();
		expect(screen.queryByText("¥0")).not.toBeInTheDocument();
	});
});
