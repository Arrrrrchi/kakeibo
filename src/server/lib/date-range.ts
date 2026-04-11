import type { DateRange } from "@/types/dashboard";

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "YYYY-MM" → "YYYY-MM-01"（月初日） */
export function toStartDate(ym: string): string {
	return `${ym}-01`;
}

/** "YYYY-MM" → 翌月の "YYYY-MM-01"（上限の半開区間用） */
export function toEndDateExclusive(ym: string): string {
	const [year, month] = ym.split("-").map(Number);
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function isValidYearMonth(value: unknown): value is string {
	return typeof value === "string" && YEAR_MONTH_PATTERN.test(value);
}

export function parseDateRange(
	searchParams: Record<string, string | string[] | undefined>,
): DateRange | undefined {
	const from = searchParams.from;
	const to = searchParams.to;

	if (!isValidYearMonth(from) || !isValidYearMonth(to)) {
		return undefined;
	}

	if (from > to) {
		return undefined;
	}

	return { from, to };
}
