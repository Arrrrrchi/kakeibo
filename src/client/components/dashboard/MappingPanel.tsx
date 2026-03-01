"use client"

import { useState } from "react"
import { Button } from "@/client/components/ui/Button"
import type { CycleType } from "@/generated/prisma/enums"
import type { BudgetItemWithMappings } from "@/types/budget"
import type { CategoryBreakdown } from "@/types/transaction"
import { BudgetFormModal } from "./BudgetFormModal"
import { BudgetItemCard } from "./BudgetItemCard"
import { TransactionDetailModal } from "./TransactionDetailModal"
import { UnmappedSection } from "./UnmappedSection"

type MappingPanelProps = {
	budgetItems: BudgetItemWithMappings[]
	allCategories: CategoryBreakdown[]
	unmappedCategories: CategoryBreakdown[]
}

const CYCLE_TYPE_ORDER: { key: CycleType; label: string }[] = [
	{ key: "monthly_fixed", label: "毎月・固定" },
	{ key: "monthly_variable", label: "毎月・変動" },
	{ key: "irregular_fixed", label: "不定期・固定" },
	{ key: "irregular_variable", label: "不定期・変動" },
]

export function MappingPanel({
	budgetItems,
	allCategories,
	unmappedCategories,
}: MappingPanelProps) {
	const [editingItem, setEditingItem] = useState<BudgetItemWithMappings | undefined>(undefined)
	const [showFormModal, setShowFormModal] = useState(false)
	const [detailCategory, setDetailCategory] = useState<{
		major: string
		minor: string
	} | null>(null)

	const groupedItems = CYCLE_TYPE_ORDER.map((cycle) => ({
		...cycle,
		items: budgetItems.filter((item) => item.cycleType === cycle.key),
	})).filter((group) => group.items.length > 0)

	const handleEdit = (item: BudgetItemWithMappings) => {
		setEditingItem(item)
		setShowFormModal(true)
	}

	const handleAdd = () => {
		setEditingItem(undefined)
		setShowFormModal(true)
	}

	const handleCloseFormModal = () => {
		setShowFormModal(false)
		setEditingItem(undefined)
	}

	const handleCategoryDetail = (majorCategory: string, minorCategory: string) => {
		setDetailCategory({ major: majorCategory, minor: minorCategory })
	}

	return (
		<div>
			<UnmappedSection
				unmappedCategories={unmappedCategories}
				onCategoryClick={handleCategoryDetail}
			/>

			{groupedItems.map((group) => (
				<div key={group.key} className="mb-4">
					<div className="bg-[#34495e] text-white text-sm font-medium px-4 py-2 rounded-t-lg">
						{group.label}
					</div>
					<div className="space-y-2 pt-2">
						{group.items.map((item) => (
							<BudgetItemCard
								key={item.id}
								budgetItem={item}
								allCategories={allCategories}
								onEdit={handleEdit}
								onCategoryDetail={handleCategoryDetail}
							/>
						))}
					</div>
				</div>
			))}

			<div className="mt-4">
				<Button type="button" variant="add" onClick={handleAdd}>
					+ 予算を追加
				</Button>
			</div>

			<BudgetFormModal
				isOpen={showFormModal}
				onClose={handleCloseFormModal}
				budgetItem={editingItem}
			/>

			{detailCategory && (
				<TransactionDetailModal
					majorCategory={detailCategory.major}
					minorCategory={detailCategory.minor}
					isOpen={true}
					onClose={() => setDetailCategory(null)}
				/>
			)}
		</div>
	)
}
