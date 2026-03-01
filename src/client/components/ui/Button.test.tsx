"use client"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Button } from "./Button"

describe("Button", () => {
	it("テキストが表示される", () => {
		render(<Button>保存</Button>)
		expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument()
	})

	it("クリックでハンドラが呼ばれる", async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()
		render(<Button onClick={handleClick}>保存</Button>)

		await user.click(screen.getByRole("button"))
		expect(handleClick).toHaveBeenCalledOnce()
	})

	it("disabled 時はクリックできない", async () => {
		const user = userEvent.setup()
		const handleClick = vi.fn()
		render(
			<Button onClick={handleClick} disabled>
				保存
			</Button>,
		)

		await user.click(screen.getByRole("button"))
		expect(handleClick).not.toHaveBeenCalled()
	})

	it("variant=danger で danger スタイルが適用される", () => {
		render(<Button variant="danger">削除</Button>)
		const button = screen.getByRole("button")
		expect(button.className).toContain("red")
	})

	it("variant=primary がデフォルトで適用される", () => {
		render(<Button>保存</Button>)
		const button = screen.getByRole("button")
		expect(button.className).toContain("bg-")
	})

	it("size=sm で小さいサイズが適用される", () => {
		render(<Button size="sm">小</Button>)
		const button = screen.getByRole("button")
		expect(button.className).toContain("px-3")
	})

	it("loading=true でスピナーが表示される", () => {
		render(<Button loading>保存</Button>)
		expect(screen.getByRole("button")).toContainElement(screen.getByTestId("spinner"))
	})
})
