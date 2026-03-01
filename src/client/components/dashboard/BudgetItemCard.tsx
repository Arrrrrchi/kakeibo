"use client"

import { useTransition } from "react"
import { formatCurrency } from "@/client/lib/format"
import { updateMappings } from "@/server/actions/update-mappings"
import type { BudgetItemWithMappings } from "@/types/budget"
import type { CategoryBreakdown } from "@/types/transaction"
import { CategoryChip } from "./CategoryChip"

type BudgetItemCardProps = {
	budgetItem: BudgetItemWithMappings
	allCategories: CategoryBreakdown[]
	onEdit: (item: BudgetItemWithMappings) => void
	onCategoryDetail?: (majorCategory: string, minorCategory: string) => void
}

export function BudgetItemCard({
	budgetItem,
	allCategories,
	onEdit,
	onCategoryDetail,
}: BudgetItemCardProps) {
	const [isPending, startTransition] = useTransition()

	const isMapped = (majorCategory: string, minorCategory: string): boolean =>
		budgetItem.mappings.some(
			(m) => m.majorCategory === majorCategory && m.minorCategory === minorCategory,
		)

	const handleChipClick = (majorCategory: string, minorCategory: string) => {
		const currentlyMapped = isMapped(majorCategory, minorCategory)
		let newCategories: { majorCategory: string; minorCategory: string }[]

		if (currentlyMapped) {
			newCategories = budgetItem.mappings
				.filter((m) => !(m.majorCategory === majorCategory && m.minorCategory === minorCategory))
				.map((m) => ({ majorCategory: m.majorCategory, minorCategory: m.minorCategory }))
		} else {
			newCategories = [
				...budgetItem.mappings.map((m) => ({
					majorCategory: m.majorCategory,
					minorCategory: m.minorCategory,
				})),
				{ majorCategory, minorCategory },
			]
		}

		startTransition(async () => {
			await updateMappings(budgetItem.id, newCategories)
		})
	}

	return (
		<div className={`bg-white border rounded-lg p-4 ${isPending ? "opacity-60" : ""}`}>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm">{budgetItem.name}</span>
					<button
						type="button"
						aria-label="編集"
						onClick={() => onEdit(budgetItem)}
						className="text-gray-400 hover:text-gray-600 text-sm"
					>
						&#9998;
					</button>
				</div>
				<span className="text-sm text-gray-600">{formatCurrency(budgetItem.monthlyAmount)}/月</span>
			</div>
			<div className="flex flex-wrap gap-1.5">
				{allCategories.map((cat) => (
					<CategoryChip
						key={`${cat.majorCategory}-${cat.minorCategory}`}
						majorCategory={cat.majorCategory}
						minorCategory={cat.minorCategory}
						selected={isMapped(cat.majorCategory, cat.minorCategory)}
						onClick={() => handleChipClick(cat.majorCategory, cat.minorCategory)}
						onDetailClick={
							onCategoryDetail
								? () => onCategoryDetail(cat.majorCategory, cat.minorCategory)
								: undefined
						}
					/>
				))}
			</div>
		</div>
	)
}
