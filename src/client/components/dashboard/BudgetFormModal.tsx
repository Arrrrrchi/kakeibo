"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/client/components/ui/Button"
import { Modal } from "@/client/components/ui/Modal"
import { deleteBudget } from "@/server/actions/delete-budget"
import { upsertBudget } from "@/server/actions/upsert-budget"
import type { BudgetItemWithMappings } from "@/types/budget"

type BudgetFormModalProps = {
	isOpen: boolean
	onClose: () => void
	budgetItem?: BudgetItemWithMappings
}

const CYCLE_OPTIONS = [
	{ value: "monthly_fixed", label: "毎月・固定" },
	{ value: "monthly_variable", label: "毎月・変動" },
	{ value: "irregular_fixed", label: "不定期・固定" },
	{ value: "irregular_variable", label: "不定期・変動" },
]

export function BudgetFormModal({ isOpen, onClose, budgetItem }: BudgetFormModalProps) {
	const isEditMode = !!budgetItem
	const title = isEditMode ? "予算項目の編集" : "予算項目の追加"
	const formRef = useRef<HTMLFormElement>(null)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	if (!isOpen) return null

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const form = e.currentTarget
		if (!form.checkValidity()) {
			form.reportValidity()
			return
		}

		const formData = new FormData(form)
		startTransition(async () => {
			const result = await upsertBudget(formData)
			if (result.success) {
				onClose()
			} else {
				setError(result.error ?? "エラーが発生しました")
			}
		})
	}

	const handleDelete = () => {
		if (!budgetItem) return
		startTransition(async () => {
			const result = await deleteBudget(budgetItem.id)
			if (result.success) {
				onClose()
			} else {
				setError(result.error ?? "削除に失敗しました")
			}
		})
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
				{isEditMode && <input type="hidden" name="id" value={budgetItem.id} />}

				<div>
					<label htmlFor="budget-name" className="block text-sm font-medium text-gray-700 mb-1">
						費目名
					</label>
					<input
						id="budget-name"
						name="name"
						type="text"
						required
						maxLength={50}
						defaultValue={budgetItem?.name ?? ""}
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-1">
						月額予算（円）
					</label>
					<input
						id="budget-amount"
						name="monthlyAmount"
						type="number"
						required
						min={0}
						step={1}
						defaultValue={budgetItem?.monthlyAmount ?? ""}
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label htmlFor="budget-cycle" className="block text-sm font-medium text-gray-700 mb-1">
						周期
					</label>
					<select
						id="budget-cycle"
						name="cycleType"
						required
						defaultValue={budgetItem?.cycleType ?? "monthly_fixed"}
						className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					>
						{CYCLE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<div className="flex items-center justify-end gap-2 pt-2">
					{isEditMode && !showDeleteConfirm && (
						<Button
							type="button"
							variant="danger"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={isPending}
							className="mr-auto"
						>
							削除
						</Button>
					)}
					{showDeleteConfirm && (
						<div className="mr-auto flex items-center gap-2">
							<span className="text-sm text-red-600">本当に削除しますか？</span>
							<Button
								type="button"
								variant="danger"
								size="sm"
								onClick={handleDelete}
								disabled={isPending}
							>
								削除する
							</Button>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={() => setShowDeleteConfirm(false)}
								disabled={isPending}
							>
								戻る
							</Button>
						</div>
					)}
					<Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
						キャンセル
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "保存中..." : "保存"}
					</Button>
				</div>
			</form>
		</Modal>
	)
}
