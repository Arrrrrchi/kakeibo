import type { DateRange } from "@/types/dashboard";

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

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
