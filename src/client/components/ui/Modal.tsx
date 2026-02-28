"use client"

import { type ReactNode, useEffect } from "react"

type ModalProps = {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div
			data-testid="modal-overlay"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
			onKeyDown={undefined}
		>
			<div
				className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={undefined}
			>
				<div className="flex items-center justify-between px-5 py-4 border-b">
					<h2 className="text-lg font-semibold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl leading-none"
					>
						×
					</button>
				</div>
				<div className="px-5 py-4 overflow-y-auto">{children}</div>
			</div>
		</div>
	)
}
