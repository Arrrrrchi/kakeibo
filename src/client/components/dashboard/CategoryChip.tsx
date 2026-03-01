"use client"

type CategoryChipProps = {
	majorCategory: string
	minorCategory: string
	selected: boolean
	onClick: () => void
	onDetailClick?: () => void
}

export function CategoryChip({
	majorCategory,
	minorCategory,
	selected,
	onClick,
	onDetailClick,
}: CategoryChipProps) {
	return (
		<span
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					onClick()
				}
			}}
			className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors border ${
				selected
					? "bg-[#2980b9] text-white border-[#2980b9]"
					: "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
			}`}
		>
			{majorCategory} / {minorCategory}
			{onDetailClick && (
				<button
					type="button"
					aria-label="詳細"
					onClick={(e) => {
						e.stopPropagation()
						onDetailClick()
					}}
					className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-black/10"
				>
					i
				</button>
			)}
		</span>
	)
}
