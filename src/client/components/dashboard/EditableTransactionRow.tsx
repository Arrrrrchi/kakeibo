"use client";

import { useRef, useState } from "react";
import { deleteTransaction } from "@/server/actions/delete-transaction";
import { updateTransaction } from "@/server/actions/update-transaction";
import type { Transaction, TransactionCategoryOption } from "@/types/transaction";
import { CategorySelect } from "./CategorySelect";

type EditableTransactionRowProps = {
	transaction: Transaction;
	categoryOptions: TransactionCategoryOption[];
	onUpdated: (updated: Transaction) => void;
	onDeleted: (id: string) => void;
};

function EditableCell({
	displayValue,
	editingValue,
	onCommit,
	inputAriaLabel,
	multiline = false,
	disabled = false,
}: {
	displayValue: string;
	editingValue: string;
	onCommit: (value: string) => void;
	inputAriaLabel: string;
	multiline?: boolean;
	disabled?: boolean;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(editingValue);
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

	// editingValue が外部から変わったとき（ロールバック時）に同期する
	const prevEditingValueRef = useRef(editingValue);
	if (prevEditingValueRef.current !== editingValue && !isEditing) {
		prevEditingValueRef.current = editingValue;
		setValue(editingValue);
	}

	const handleStartEdit = () => {
		setValue(editingValue);
		setIsEditing(true);
		// focus は useEffect の代わりに ref コールバックで行う
	};

	const handleCommit = () => {
		if (disabled) return;
		setIsEditing(false);
		onCommit(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setIsEditing(false);
			setValue(editingValue);
			return;
		}
		if (e.key === "Enter" && !multiline) {
			if (disabled) return;
			handleCommit();
		}
	};

	if (isEditing) {
		if (multiline) {
			return (
				<textarea
					ref={(el) => {
						inputRef.current = el;
						if (el) el.focus();
					}}
					aria-label={inputAriaLabel}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleCommit}
					onKeyDown={handleKeyDown}
				/>
			);
		}
		return (
			<input
				ref={(el) => {
					inputRef.current = el;
					if (el) el.focus();
				}}
				aria-label={inputAriaLabel}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleCommit}
				onKeyDown={handleKeyDown}
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={handleStartEdit}
			className="cursor-text bg-transparent text-left"
			disabled={disabled}
		>
			{displayValue}
		</button>
	);
}

export function EditableTransactionRow({
	transaction,
	categoryOptions,
	onUpdated,
	onDeleted,
}: EditableTransactionRowProps) {
	const [description, setDescription] = useState(transaction.description);
	const [amount, setAmount] = useState(String(transaction.amount));
	const [memo, setMemo] = useState(transaction.memo ?? "");
	const [majorCategory, setMajorCategory] = useState(transaction.majorCategory);
	const [minorCategory, setMinorCategory] = useState(transaction.minorCategory);
	const [isTransfer, setIsTransfer] = useState(transaction.isTransfer);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// 直前の成功値を記録する ref（失敗時のロールバック先）
	const lastSavedRef = useRef({
		description: transaction.description,
		amount: String(transaction.amount),
		memo: transaction.memo ?? "",
		majorCategory: transaction.majorCategory,
		minorCategory: transaction.minorCategory,
		isTransfer: transaction.isTransfer,
	});

	const handleSave = async (updatedValues: {
		description?: string;
		amount?: number;
		majorCategory?: string;
		minorCategory?: string;
		memo?: string | null;
		isTransfer?: boolean;
	}) => {
		const rollback = () => {
			setDescription(lastSavedRef.current.description);
			setAmount(lastSavedRef.current.amount);
			setMemo(lastSavedRef.current.memo);
			setMajorCategory(lastSavedRef.current.majorCategory);
			setMinorCategory(lastSavedRef.current.minorCategory);
			setIsTransfer(lastSavedRef.current.isTransfer);
		};

		setIsSaving(true);
		setErrorMessage(null);
		try {
			const input = {
				description,
				amount: Number(amount),
				majorCategory,
				minorCategory,
				memo: memo || null,
				isTransfer,
				...updatedValues,
			};

			const result = await updateTransaction(transaction.id, {
				description: input.description,
				amount: input.amount,
				majorCategory: input.majorCategory,
				minorCategory: input.minorCategory,
				memo: input.memo,
				isTransfer: input.isTransfer,
			});

			if (result.success) {
				// 成功時に lastSaved を更新
				lastSavedRef.current = {
					description: input.description,
					amount: String(input.amount),
					memo: input.memo ?? "",
					majorCategory: input.majorCategory,
					minorCategory: input.minorCategory,
					isTransfer: input.isTransfer,
				};
				onUpdated(result.data);
			} else {
				// 失敗時は直前の成功値にロールバック
				rollback();
				setErrorMessage(result.error);
			}
		} catch (error) {
			console.error(error);
			// 例外時も直前の成功値にロールバック
			rollback();
			setErrorMessage("取引の更新に失敗しました");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCategoryChange = (newMajor: string, newMinor: string) => {
		setMajorCategory(newMajor);
		setMinorCategory(newMinor);
		handleSave({ majorCategory: newMajor, minorCategory: newMinor });
	};

	const handleTransferChange = (checked: boolean) => {
		setIsTransfer(checked);
		handleSave({ isTransfer: checked });
	};

	const handleDelete = async () => {
		if (!window.confirm("この取引を削除しますか？")) {
			return;
		}
		const result = await deleteTransaction(transaction.id);
		if (result.success) {
			onDeleted(transaction.id);
		}
	};

	const dateStr = transaction.date.toISOString().slice(0, 10);

	return (
		<tr aria-busy={isSaving ? "true" : undefined} className={isSaving ? "opacity-50" : undefined}>
			<td className="py-1 px-2 whitespace-nowrap">{dateStr}</td>
			<td className="py-1 px-2 max-w-40">
				<EditableCell
					displayValue={description}
					editingValue={description}
					onCommit={(value) => {
						setDescription(value);
						handleSave({ description: value });
					}}
					inputAriaLabel="description"
					disabled={isSaving}
				/>
				{errorMessage && <span role="alert">{errorMessage}</span>}
			</td>
			<td className="py-1 px-2 whitespace-nowrap text-right">
				<EditableCell
					displayValue={amount}
					editingValue={amount}
					onCommit={(value) => {
						const num = Number(value);
						if (!Number.isFinite(num) || num < 0) {
							setErrorMessage("金額は0以上の数値を入力してください");
							return;
						}
						setAmount(value);
						handleSave({ amount: num });
					}}
					inputAriaLabel="amount"
					disabled={isSaving}
				/>
			</td>
			<td className="py-1 px-2 whitespace-nowrap">
				<CategorySelect
					options={categoryOptions}
					majorValue={majorCategory}
					minorValue={minorCategory}
					onChange={handleCategoryChange}
					disabled={isSaving}
				/>
			</td>
			<td className="py-1 px-2 max-w-30">
				<EditableCell
					displayValue={memo}
					editingValue={memo}
					onCommit={(value) => {
						setMemo(value);
						handleSave({ memo: value || null });
					}}
					inputAriaLabel="memo"
					multiline
					disabled={isSaving}
				/>
			</td>
			<td className="py-1 px-2 text-center whitespace-nowrap">
				<input
					type="checkbox"
					aria-label="振替"
					checked={isTransfer}
					onChange={(e) => handleTransferChange(e.target.checked)}
					disabled={isSaving}
				/>
			</td>
			<td className="py-1 px-2 whitespace-nowrap">
				<button
					type="button"
					onClick={handleDelete}
					aria-label="削除"
					className="text-red-500 hover:text-red-700 text-xs"
				>
					削除
				</button>
			</td>
		</tr>
	);
}
