import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CategoryChip } from "./CategoryChip"

describe("CategoryChip", () => {
	it("大項目/中項目が表示される", () => {
		render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={false}
				onClick={vi.fn()}
			/>,
		)
		expect(screen.getByText(/電気代/)).toBeInTheDocument()
	})

	it("selected=true で選択状態のスタイルが適用される", () => {
		const { container } = render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={true}
				onClick={vi.fn()}
			/>,
		)
		const chip = container.firstChild as HTMLElement
		expect(chip.className).toContain("bg-")
		expect(chip.className).toContain("text-white")
	})

	it("selected=false で未選択状態のスタイルが適用される", () => {
		const { container } = render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={false}
				onClick={vi.fn()}
			/>,
		)
		const chip = container.firstChild as HTMLElement
		expect(chip.className).not.toContain("text-white")
	})

	it("クリックで onClick が呼ばれる", async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={false}
				onClick={onClick}
			/>,
		)

		await user.click(screen.getByText(/電気代/))
		expect(onClick).toHaveBeenCalledOnce()
	})

	it("onDetailClick が渡された場合、詳細ボタンが表示される", () => {
		render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={false}
				onClick={vi.fn()}
				onDetailClick={vi.fn()}
			/>,
		)
		expect(screen.getByRole("button", { name: /詳細/ })).toBeInTheDocument()
	})

	it("詳細ボタンクリックで onDetailClick が呼ばれ、onClick は呼ばれない", async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		const onDetailClick = vi.fn()
		render(
			<CategoryChip
				majorCategory="水道・光熱費"
				minorCategory="電気代"
				selected={false}
				onClick={onClick}
				onDetailClick={onDetailClick}
			/>,
		)

		await user.click(screen.getByRole("button", { name: /詳細/ }))
		expect(onDetailClick).toHaveBeenCalledOnce()
		expect(onClick).not.toHaveBeenCalled()
	})
})
