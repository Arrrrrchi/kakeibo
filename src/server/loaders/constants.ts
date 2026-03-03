import type { CycleType } from "@/generated/prisma/enums";

export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
	monthly_fixed: "毎月・固定",
	monthly_variable: "毎月・変動",
	irregular_fixed: "不定期・固定",
	irregular_variable: "不定期・変動",
};

export const CYCLE_TYPE_ORDER: CycleType[] = [
	"monthly_fixed",
	"monthly_variable",
	"irregular_fixed",
	"irregular_variable",
];
