"use client";

import type { TransactionCategoryOption } from "@/types/transaction";

type CategorySelectProps = {
	options: TransactionCategoryOption[];
	majorValue: string;
	minorValue: string;
	onChange: (major: string, minor: string) => void;
	disabled?: boolean;
};

export function CategorySelect({
	options,
	majorValue,
	minorValue,
	onChange,
	disabled = false,
}: CategorySelectProps) {
	const majorCategories = [...new Set(options.map((opt) => opt.majorCategory))];

	const minorOptions = options
		.filter((opt) => opt.majorCategory === majorValue)
		.map((opt) => opt.minorCategory);

	const handleMajorChange = (newMajor: string) => {
		const firstMinor = options.find((opt) => opt.majorCategory === newMajor)?.minorCategory ?? "";
		onChange(newMajor, firstMinor);
	};

	const handleMinorChange = (newMinor: string) => {
		onChange(majorValue, newMinor);
	};

	return (
		<div className="flex gap-2">
			<select
				aria-label="大項目"
				value={majorValue}
				onChange={(e) => handleMajorChange(e.target.value)}
				disabled={disabled}
				className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{majorCategories.map((major) => (
					<option key={major} value={major}>
						{major}
					</option>
				))}
			</select>
			<select
				aria-label="中項目"
				value={minorValue}
				onChange={(e) => handleMinorChange(e.target.value)}
				disabled={disabled}
				className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{minorOptions.map((minor) => (
					<option key={minor} value={minor}>
						{minor}
					</option>
				))}
			</select>
		</div>
	);
}
