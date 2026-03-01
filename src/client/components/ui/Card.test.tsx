import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Card } from "./Card"

describe("Card", () => {
	it("子要素が表示される", () => {
		render(
			<Card>
				<p>コンテンツ</p>
			</Card>,
		)
		expect(screen.getByText("コンテンツ")).toBeInTheDocument()
	})

	it("title を指定するとヘッダーが表示される", () => {
		render(
			<Card title="タイトル">
				<p>コンテンツ</p>
			</Card>,
		)
		expect(screen.getByText("タイトル")).toBeInTheDocument()
	})

	it("title を指定しないとヘッダーが表示されない", () => {
		render(
			<Card>
				<p>コンテンツ</p>
			</Card>,
		)
		expect(screen.queryByRole("heading")).not.toBeInTheDocument()
	})
})
