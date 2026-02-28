"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger" | "add"
type ButtonSize = "default" | "sm"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
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

export function Button({
	variant = "primary",
	size = "default",
	children,
	className = "",
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	)
}
