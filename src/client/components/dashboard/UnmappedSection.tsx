"use client"

import { useState } from "react"
import type { CategoryBreakdown } from "@/types/transaction"
import { CategoryChip } from "./CategoryChip"

type UnmappedSectionProps = {
	unmappedCategories: CategoryBreakdown[]
	onCategoryClick: (majorCategory: string, minorCategory: string) => void
}

export function UnmappedSection({ unmappedCategories, onCategoryClick }: UnmappedSectionProps) {
	const [expanded, setExpanded] = useState(true)

	if (unmappedCategories.length === 0) return null

	return (
		<div className="sticky top-0 z-10 bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-semibold text-amber-800">
					未割当のカテゴリ ({unmappedCategories.length}件)
				</h3>
				<button
					type="button"
					aria-label="折りたたみ"
					onClick={() => setExpanded(!expanded)}
					className="text-amber-600 hover:text-amber-800 text-sm"
				>
					{expanded ? "▲" : "▼"}
				</button>
			</div>
			{expanded && (
				<>
					<p className="text-xs text-amber-700 mb-3">
						どの予算にも紐づいていない支出カテゴリです
					</p>
					<div className="flex flex-wrap gap-2">
						{unmappedCategories.map((cat) => (
							<CategoryChip
								key={`${cat.majorCategory}-${cat.minorCategory}`}
								majorCategory={cat.majorCategory}
								minorCategory={cat.minorCategory}
								selected={false}
								onClick={() => onCategoryClick(cat.majorCategory, cat.minorCategory)}
							/>
						))}
					</div>
				</>
			)}
		</div>
	)
}
