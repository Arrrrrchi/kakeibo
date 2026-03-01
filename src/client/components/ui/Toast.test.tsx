import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ToastProvider, useToast } from "./Toast"

function TestConsumer() {
	const { showToast } = useToast()
	return (
		<>
			<button type="button" onClick={() => showToast("成功メッセージ", "success")}>
				成功
			</button>
			<button type="button" onClick={() => showToast("エラーメッセージ", "error")}>
				エラー
			</button>
		</>
	)
}

describe("Toast", () => {
	it("成功トーストを表示できる", async () => {
		const user = userEvent.setup()
		render(
			<ToastProvider>
				<TestConsumer />
			</ToastProvider>,
		)

		await user.click(screen.getByText("成功"))
		expect(screen.getByText("成功メッセージ")).toBeInTheDocument()
	})

	it("エラートーストを表示できる", async () => {
		const user = userEvent.setup()
		render(
			<ToastProvider>
				<TestConsumer />
			</ToastProvider>,
		)

		await user.click(screen.getByText("エラー"))
		expect(screen.getByText("エラーメッセージ")).toBeInTheDocument()
	})

	it("エラートーストは閉じるボタンで消去できる", async () => {
		const user = userEvent.setup()
		render(
			<ToastProvider>
				<TestConsumer />
			</ToastProvider>,
		)

		await user.click(screen.getByText("エラー"))
		expect(screen.getByText("エラーメッセージ")).toBeInTheDocument()

		await user.click(screen.getByLabelText("閉じる"))
		expect(screen.queryByText("エラーメッセージ")).not.toBeInTheDocument()
	})

	it("トーストが表示されていないときは何もレンダリングしない", () => {
		render(
			<ToastProvider>
				<TestConsumer />
			</ToastProvider>,
		)

		expect(screen.queryByRole("alert")).not.toBeInTheDocument()
	})

	describe("自動消去", () => {
		beforeEach(() => {
			vi.useFakeTimers({ shouldAdvanceTime: true })
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it("成功トーストは3秒後に自動消去される", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
			render(
				<ToastProvider>
					<TestConsumer />
				</ToastProvider>,
			)

			await user.click(screen.getByText("成功"))
			expect(screen.getByText("成功メッセージ")).toBeInTheDocument()

			act(() => {
				vi.advanceTimersByTime(3000)
			})
			expect(screen.queryByText("成功メッセージ")).not.toBeInTheDocument()
		})

		it("エラートーストは自動消去されない", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
			render(
				<ToastProvider>
					<TestConsumer />
				</ToastProvider>,
			)

			await user.click(screen.getByText("エラー"))
			expect(screen.getByText("エラーメッセージ")).toBeInTheDocument()

			act(() => {
				vi.advanceTimersByTime(5000)
			})
			expect(screen.getByText("エラーメッセージ")).toBeInTheDocument()
		})
	})
})
