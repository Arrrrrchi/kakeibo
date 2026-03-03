import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./Table";

const columns = [
	{ key: "name", header: "名前" },
	{ key: "amount", header: "金額" },
];

const data = [
	{ name: "食費", amount: "¥30,000" },
	{ name: "住居費", amount: "¥80,000" },
];

describe("Table", () => {
	it("ヘッダーが表示される", () => {
		render(<Table columns={columns} data={data} />);
		expect(screen.getByText("名前")).toBeInTheDocument();
		expect(screen.getByText("金額")).toBeInTheDocument();
	});

	it("データ行が表示される", () => {
		render(<Table columns={columns} data={data} />);
		expect(screen.getByText("食費")).toBeInTheDocument();
		expect(screen.getByText("¥30,000")).toBeInTheDocument();
		expect(screen.getByText("住居費")).toBeInTheDocument();
	});

	it("データが空の場合はヘッダーのみ表示される", () => {
		render(<Table columns={columns} data={[]} />);
		expect(screen.getByText("名前")).toBeInTheDocument();
		expect(screen.queryByRole("cell")).not.toBeInTheDocument();
	});
});
