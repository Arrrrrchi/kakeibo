import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateRangeFilter } from "./DateRangeFilter";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => vi.clearAllMocks());

describe("DateRangeFilter", () => {
	it("初期値が描画されること", () => {
		render(<DateRangeFilter initialFrom="2024-01" initialTo="2024-12" />);

		expect(screen.getByLabelText("開始年月")).toHaveValue("2024-01");
		expect(screen.getByLabelText("終了年月")).toHaveValue("2024-12");
	});

	it("初期値なしで描画されること", () => {
		render(<DateRangeFilter />);

		expect(screen.getByLabelText("開始年月")).toHaveValue("");
		expect(screen.getByLabelText("終了年月")).toHaveValue("");
	});

	it("入力変更後にフォームを submit すると router.push が期待 URL で呼ばれること", async () => {
		const user = userEvent.setup();
		render(<DateRangeFilter />);

		await user.type(screen.getByLabelText("開始年月"), "2024-03");
		await user.type(screen.getByLabelText("終了年月"), "2024-06");
		await user.click(screen.getByRole("button", { name: "絞り込む" }));

		expect(mockPush).toHaveBeenCalledWith("/dashboard?from=2024-03&to=2024-06");
	});

	it("クリアボタンで /dashboard に遷移すること", async () => {
		const user = userEvent.setup();
		render(<DateRangeFilter initialFrom="2024-01" initialTo="2024-12" />);

		await user.click(screen.getByRole("button", { name: "クリア" }));

		expect(mockPush).toHaveBeenCalledWith("/dashboard");
	});

	it("from > to のとき submit ボタンが disabled になること", async () => {
		const user = userEvent.setup();
		render(<DateRangeFilter />);

		await user.type(screen.getByLabelText("開始年月"), "2024-06");
		await user.type(screen.getByLabelText("終了年月"), "2024-03");

		expect(screen.getByRole("button", { name: "絞り込む" })).toBeDisabled();
	});

	it("from のみ入力で to が空のとき submit ボタンが disabled になること", async () => {
		const user = userEvent.setup();
		render(<DateRangeFilter />);

		await user.type(screen.getByLabelText("開始年月"), "2024-03");

		expect(screen.getByRole("button", { name: "絞り込む" })).toBeDisabled();
	});

	it("to のみ入力で from が空のとき submit ボタンが disabled になること", async () => {
		const user = userEvent.setup();
		render(<DateRangeFilter />);

		await user.type(screen.getByLabelText("終了年月"), "2024-06");

		expect(screen.getByRole("button", { name: "絞り込む" })).toBeDisabled();
	});
});
