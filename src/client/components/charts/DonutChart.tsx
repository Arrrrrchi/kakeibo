"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/client/lib/format";

type DonutChartItem = {
	key: string;
	label: string;
	amount: number;
	color: string;
};

type DonutChartProps = {
	items: DonutChartItem[];
	centerLabel?: ReactNode;
	size?: number;
};

const EMPTY_COLOR = "#d1d5db";

export function DonutChart({ items, centerLabel, size = 220 }: DonutChartProps) {
	const total = items.reduce((sum, item) => sum + item.amount, 0);
	const isEmpty = items.length === 0 || total === 0;

	const chartData = isEmpty
		? [{ key: "__empty__", label: "データなし", amount: 1, color: EMPTY_COLOR }]
		: items;

	const centerContent = isEmpty ? (
		<span className="text-sm text-gray-400">データなし</span>
	) : (
		centerLabel
	);

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						innerRadius={size * 0.3}
						outerRadius={size * 0.45}
						dataKey="amount"
						nameKey="label"
						isAnimationActive={false}
					>
						{chartData.map((item) => (
							<Cell key={item.key} fill={item.color} />
						))}
					</Pie>
					{!isEmpty && (
						<Tooltip
							formatter={(value) => formatCurrency(Number(value))}
							labelFormatter={(_, payload) => {
								if (payload.length > 0) {
									return String(payload[0].name ?? "");
								}
								return "";
							}}
						/>
					)}
				</PieChart>
			</ResponsiveContainer>
			{centerContent !== undefined && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					{centerContent}
				</div>
			)}
		</div>
	);
}
