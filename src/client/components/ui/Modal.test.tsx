import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
	it("isOpen=true でモーダルが表示される", () => {
		render(
			<Modal isOpen={true} onClose={vi.fn()} title="テスト">
				<p>コンテンツ</p>
			</Modal>,
		);
		expect(screen.getByText("テスト")).toBeInTheDocument();
		expect(screen.getByText("コンテンツ")).toBeInTheDocument();
	});

	it("isOpen=false でモーダルが非表示", () => {
		render(
			<Modal isOpen={false} onClose={vi.fn()} title="テスト">
				<p>コンテンツ</p>
			</Modal>,
		);
		expect(screen.queryByText("テスト")).not.toBeInTheDocument();
	});

	it("ESC キーで onClose が呼ばれる", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={onClose} title="テスト">
				<p>コンテンツ</p>
			</Modal>,
		);

		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("オーバーレイクリックで onClose が呼ばれる", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={onClose} title="テスト">
				<p>コンテンツ</p>
			</Modal>,
		);

		await user.click(screen.getByTestId("modal-overlay"));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("モーダル内部クリックでは閉じない", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={onClose} title="テスト">
				<p>コンテンツ</p>
			</Modal>,
		);

		await user.click(screen.getByText("コンテンツ"));
		expect(onClose).not.toHaveBeenCalled();
	});
});
