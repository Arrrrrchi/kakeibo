import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CategorySelect } from "./CategorySelect";

// 制御コンポーネントとして動作確認するためのラッパー
function ControlledCategorySelect({
	initialMajor,
	initialMinor,
}: {
	initialMajor: string;
	initialMinor: string;
}) {
	const [major, setMajor] = useState(initialMajor);
	const [minor, setMinor] = useState(initialMinor);
	return (
		<CategorySelect
			options={options}
			majorValue={major}
			minorValue={minor}
			onChange={(newMajor, newMinor) => {
				setMajor(newMajor);
				setMinor(newMinor);
			}}
		/>
	);
}

const options = [
	{ majorCategory: "食費", minorCategory: "外食" },
	{ majorCategory: "食費", minorCategory: "自炊" },
	{ majorCategory: "水道・光熱費", minorCategory: "電気代" },
	{ majorCategory: "水道・光熱費", minorCategory: "ガス代" },
	{ majorCategory: "水道・光熱費", minorCategory: "水道代" },
];

describe("CategorySelect", () => {
	it("大項目 select が majorValue で初期選択されている", () => {
		render(
			<CategorySelect
				options={options}
				majorValue="水道・光熱費"
				minorValue="電気代"
				onChange={vi.fn()}
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		expect((selects[0] as HTMLSelectElement).value).toBe("水道・光熱費");
	});

	it("中項目 select が minorValue で初期選択されている", () => {
		render(
			<CategorySelect
				options={options}
				majorValue="水道・光熱費"
				minorValue="ガス代"
				onChange={vi.fn()}
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		expect((selects[1] as HTMLSelectElement).value).toBe("ガス代");
	});

	it("大項目を変更すると中項目候補が絞り込まれる", async () => {
		const user = userEvent.setup();
		render(<ControlledCategorySelect initialMajor="食費" initialMinor="外食" />);

		const selects = screen.getAllByRole("combobox");
		// 初期状態：食費の中項目のみ
		const initialMinorOptions = screen
			.getAllByRole("option")
			.filter((opt) => (opt as HTMLOptionElement).parentElement === selects[1]);
		expect(initialMinorOptions).toHaveLength(2);

		// 大項目を「水道・光熱費」に変更
		await user.selectOptions(selects[0], "水道・光熱費");

		// 中項目が水道・光熱費の3件に絞り込まれる
		const updatedMinorOptions = screen
			.getAllByRole("option")
			.filter((opt) => (opt as HTMLOptionElement).parentElement === selects[1]);
		expect(updatedMinorOptions).toHaveLength(3);
	});

	it("大項目変更時に onChange(newMajor, firstMinorOfNewMajor) が呼ばれる", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<CategorySelect options={options} majorValue="食費" minorValue="外食" onChange={onChange} />,
		);

		const selects = screen.getAllByRole("combobox");
		await user.selectOptions(selects[0], "水道・光熱費");

		expect(onChange).toHaveBeenCalledWith("水道・光熱費", "電気代");
	});

	it("中項目を変更すると onChange(majorValue, newMinor) が呼ばれる", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<CategorySelect
				options={options}
				majorValue="水道・光熱費"
				minorValue="電気代"
				onChange={onChange}
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		await user.selectOptions(selects[1], "ガス代");

		expect(onChange).toHaveBeenCalledWith("水道・光熱費", "ガス代");
	});

	it("disabled=true のとき両方の select が disabled になる", () => {
		render(
			<CategorySelect
				options={options}
				majorValue="食費"
				minorValue="外食"
				onChange={vi.fn()}
				disabled={true}
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		expect(selects[0]).toBeDisabled();
		expect(selects[1]).toBeDisabled();
	});

	it("親から majorValue prop を変更すると大項目 select に反映される", () => {
		const { rerender } = render(
			<CategorySelect options={options} majorValue="食費" minorValue="外食" onChange={vi.fn()} />,
		);

		rerender(
			<CategorySelect
				options={options}
				majorValue="水道・光熱費"
				minorValue="電気代"
				onChange={vi.fn()}
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		expect((selects[0] as HTMLSelectElement).value).toBe("水道・光熱費");
	});

	it("options が空配列のときクラッシュしない", () => {
		expect(() => {
			render(<CategorySelect options={[]} majorValue="" minorValue="" onChange={vi.fn()} />);
		}).not.toThrow();
	});
});
