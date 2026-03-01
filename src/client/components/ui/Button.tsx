"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger" | "add"
type ButtonSize = "default" | "sm"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
	loading?: boolean
	children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
	primary: "bg-[#1a1a2e] text-white hover:bg-[#2c3e50]",
	secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
	danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-200",
	add: "bg-green-50 text-green-800 border border-green-200 hover:bg-green-200",
}

const sizeStyles: Record<ButtonSize, string> = {
	default: "px-4 py-2 text-sm",
	sm: "px-3 py-1.5 text-xs",
}

function Spinner() {
	return (
		<svg
			data-testid="spinner"
			className="animate-spin h-4 w-4"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	)
}

export function Button({
	variant = "primary",
	size = "default",
	loading = false,
	children,
	className = "",
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			disabled={disabled || loading}
			{...props}
		>
			{loading && <Spinner />}
			{children}
		</button>
	)
}
