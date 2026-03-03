type KpiColor = "green" | "red" | "orange";

type KpiCardProps = {
	label: string;
	value: string;
	sub?: string;
	color: KpiColor;
};

const colorStyles: Record<KpiColor, string> = {
	green: "text-green-600",
	red: "text-red-600",
	orange: "text-orange-500",
};

export function KpiCard({ label, value, sub, color }: KpiCardProps) {
	return (
		<div className="bg-white rounded-xl p-5 shadow-sm">
			<p className="text-xs text-gray-500">{label}</p>
			<p className={`text-2xl font-bold mt-1 ${colorStyles[color]}`}>{value}</p>
			{sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
		</div>
	);
}
