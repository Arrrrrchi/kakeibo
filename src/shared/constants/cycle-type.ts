import type { CycleType } from "@/generated/prisma/enums";

export const CYCLE_TYPE_LABEL: Record<CycleType, string> = {
	monthly_fixed: "毎月の固定支出",
	monthly_variable: "毎月の変動支出",
	irregular_fixed: "単発の固定支出",
	irregular_variable: "単発の変動支出",
};

export const CYCLE_TYPE_COLOR: Record<CycleType, string> = {
	monthly_fixed: "#3b82f6",
	monthly_variable: "#eab308",
	irregular_fixed: "#f97316",
	irregular_variable: "#a855f7",
};

export const CYCLE_TYPE_ORDER: CycleType[] = [
	"monthly_fixed",
	"monthly_variable",
	"irregular_fixed",
	"irregular_variable",
];

export const UNCLASSIFIED_KEY = "unclassified";
export const UNCLASSIFIED_LABEL = "未分類";
export const UNCLASSIFIED_COLOR = "#9ca3af";

const FALLBACK_LABEL = "不明";
const FALLBACK_COLOR = "#9ca3af";

export function getCycleTypeLabel(cycleType: CycleType): string {
	return CYCLE_TYPE_LABEL[cycleType] ?? FALLBACK_LABEL;
}

export function getCycleTypeColor(cycleType: CycleType): string {
	return CYCLE_TYPE_COLOR[cycleType] ?? FALLBACK_COLOR;
}
