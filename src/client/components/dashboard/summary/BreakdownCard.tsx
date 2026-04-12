"use client";

import { useState } from "react";
import { DonutChart } from "@/client/components/charts/DonutChart";
import { UNCLASSIFIED_COLOR, UNCLASSIFIED_KEY } from "@/client/lib/cycle-type";
import { formatCurrency } from "@/client/lib/format";
import type { BreakdownItem } from "@/types/dashboard";

export const BUDGET_ITEM_PALETTE: string[] = [
	"#10b981",
	"#ef4444",
	"#3b82f6",
	"#8b5cf6",
	"#eab308",
	"#f97316",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
	"#6b7280",
];

type TabType = "item" | "enemy";

type Props = {
	byBudgetItem: BreakdownItem[];
	byCycleType: BreakdownItem[];
	monthlyAvgExpense: number;
};

function assignBudgetItemColors(items: BreakdownItem[]): BreakdownItem[] {
	let paletteIndex = 0;
	return items.map((item) => {
		if (item.key === UNCLASSIFIED_KEY) {
			return { ...item, color: UNCLASSIFIED_COLOR };
		}
		const color = BUDGET_ITEM_PALETTE[paletteIndex % BUDGET_ITEM_PALETTE.length];
		paletteIndex++;
		return { ...item, color };
	});
}

function sortItems(items: BreakdownItem[]): BreakdownItem[] {
	const nonUnclassified = items
		.filter((item) => item.key !== UNCLASSIFIED_KEY)
		.sort((a, b) => b.amount - a.amount);
	const unclassified = items.filter((item) => item.key === UNCLASSIFIED_KEY);
	return [...nonUnclassified, ...unclassified];
}

function filterListItems(items: BreakdownItem[]): BreakdownItem[] {
	return items.filter((item) => item.amount > 0);
}

function formatRatioPercent(ratio: number): string {
	return `${Math.round(ratio * 100)}%`;
}

export function BreakdownCard({ byBudgetItem, byCycleType, monthlyAvgExpense }: Props) {
	const [activeTab, setActiveTab] = useState<TabType>("item");

	const coloredBudgetItems = assignBudgetItemColors(byBudgetItem);
	const sortedBudgetItems = sortItems(coloredBudgetItems);
	const sortedCycleItems = sortItems(byCycleType);

	const currentItems = activeTab === "item" ? sortedBudgetItems : sortedCycleItems;
	const listItems = filterListItems(currentItems);

	const isEmpty = listItems.length === 0;

	const centerLabel = (
		<div className="flex flex-col items-center justify-center text-center">
			<span className="text-xs text-gray-500">月間の平均支出</span>
			<span className="text-sm font-semibold text-gray-800 tabular-nums">
				{`${formatCurrency(monthlyAvgExpense)}/月`}
			</span>
		</div>
	);

	return (
		<div className="rounded-2xl bg-white shadow-sm p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-lg font-semibold text-gray-800">支出の内訳</h2>
				<div className="rounded-full bg-slate-100 p-1 flex gap-1">
					<button
						type="button"
						aria-label="項目別"
						onClick={() => setActiveTab("item")}
						className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
							activeTab === "item"
								? "bg-white shadow text-gray-800"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						項目別
					</button>
					<button
						type="button"
						aria-label="4つの敵別"
						onClick={() => setActiveTab("enemy")}
						className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
							activeTab === "enemy"
								? "bg-white shadow text-gray-800"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						4つの敵別
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
				<DonutChart items={listItems} centerLabel={centerLabel} size={220} />

				<div>
					{isEmpty ? (
						<p className="text-sm text-gray-400 text-center">支出の記録がありません</p>
					) : (
						<ul className="space-y-2">
							{listItems.map((item) => (
								<li key={item.key} className="flex items-center gap-2">
									<span
										className="w-2.5 h-2.5 rounded-full flex-shrink-0"
										style={{ backgroundColor: item.color }}
									/>
									<span className="flex-1 text-sm text-gray-700 truncate">{item.label}</span>
									<span className="text-sm text-gray-500 w-10 text-right">
										{formatRatioPercent(item.ratio)}
									</span>
									<span className="text-sm font-medium text-gray-800 text-right tabular-nums whitespace-nowrap">
										{`${formatCurrency(item.amount)}/月`}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
