import type { ReactNode } from "react"

type CardProps = {
	title?: string
	children: ReactNode
	className?: string
}

export function Card({ title, children, className = "" }: CardProps) {
	return (
		<div className={`bg-white rounded-xl p-5 shadow-sm ${className}`}>
			{title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
			{children}
		</div>
	)
}
