import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
	{ value: "a", label: "オプションA" },
	{ value: "b", label: "オプションB" },
	{ value: "c", label: "オプションC" },
];

describe("Select", () => {
	it("ラベルが表示される", () => {
		render(<Select label="期間" options={options} value="a" onChange={vi.fn()} />);
		expect(screen.getByText("期間")).toBeInTheDocument();
	});

	it("すべてのオプションが表示される", () => {
		render(<Select label="期間" options={options} value="a" onChange={vi.fn()} />);
		expect(screen.getAllByRole("option")).toHaveLength(3);
	});

	it("選択変更で onChange が呼ばれる", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Select label="期間" options={options} value="a" onChange={onChange} />);

		await user.selectOptions(screen.getByRole("combobox"), "b");
		expect(onChange).toHaveBeenCalledWith("b");
	});
});
