"use client"

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react"

type ToastType = "success" | "error"

type ToastState = {
	message: string
	type: ToastType
}

type ToastContextValue = {
	showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext)
	if (!ctx) {
		throw new Error("useToast must be used within a ToastProvider")
	}
	return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ToastState | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	const showToast = useCallback((message: string, type: ToastType) => {
		if (timerRef.current) clearTimeout(timerRef.current)
		setToast({ message, type })

		if (type === "success") {
			timerRef.current = setTimeout(() => {
				setToast(null)
			}, 3000)
		}
	}, [])

	const dismiss = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
		setToast(null)
	}, [])

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{toast && <ToastMessage toast={toast} onDismiss={dismiss} />}
		</ToastContext.Provider>
	)
}

function ToastMessage({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
	const isError = toast.type === "error"
	const bgColor = isError ? "bg-red-600" : "bg-green-600"

	return (
		<div
			role="alert"
			className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${bgColor}`}
		>
			<span>{toast.message}</span>
			{isError && (
				<button
					type="button"
					aria-label="閉じる"
					onClick={onDismiss}
					className="text-white/80 hover:text-white"
				>
					✕
				</button>
			)}
		</div>
	)
}

export function Toast() {
	return null
}
