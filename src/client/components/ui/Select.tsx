"use client";

type SelectOption = {
	value: string;
	label: string;
};

type SelectProps = {
	label: string;
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	className?: string;
};

export function Select({ label, options, value, onChange, className = "" }: SelectProps) {
	return (
		<div className={className}>
			<label className="block text-xs text-gray-600 mb-1">
				{label}
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
				>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}
