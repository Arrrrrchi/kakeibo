"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			if (e.key === "Tab" && dialogRef.current) {
				const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);
				if (focusable.length === 0) return;

				const first = focusable[0];
				const last = focusable[focusable.length - 1];

				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		},
		[onClose],
	);

	useEffect(() => {
		if (!isOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		document.addEventListener("keydown", handleKeyDown, true);

		const previousFocus = document.activeElement as HTMLElement | null;
		const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		focusable?.[0]?.focus();

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown, true);
			previousFocus?.focus();
		};
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: overlay click to close is standard modal UX
		// biome-ignore lint/a11y/useKeyWithClickEvents: ESC key handled via document event listener
		<div
			data-testid="modal-overlay"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className="bg-white rounded-xl shadow-xl w-[95vw] max-w-5xl mx-auto max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-5 py-4 border-b">
					<h2 className="text-lg font-semibold">{title}</h2>
					<button
						type="button"
						aria-label="閉じる"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl leading-none"
					>
						×
					</button>
				</div>
				<div className="px-5 py-4 overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
