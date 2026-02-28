import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { KpiCard } from "./KpiCard"

describe("KpiCard", () => {
	it("ラベル・値・サブテキストが表示される", () => {
		render(<KpiCard label="総支出" value="¥2,345,678" sub="月平均 ¥195,473" color="red" />)

		expect(screen.getByText("総支出")).toBeInTheDocument()
		expect(screen.getByText("¥2,345,678")).toBeInTheDocument()
		expect(screen.getByText("月平均 ¥195,473")).toBeInTheDocument()
	})

	it("color=green で緑色のスタイルが適用される", () => {
		render(<KpiCard label="総収入" value="¥100,000" color="green" />)
		const value = screen.getByText("¥100,000")
		expect(value.className).toContain("green")
	})

	it("sub を省略しても表示できる", () => {
		render(<KpiCard label="収支差額" value="¥50,000" color="green" />)
		expect(screen.getByText("収支差額")).toBeInTheDocument()
		expect(screen.getByText("¥50,000")).toBeInTheDocument()
	})
})
