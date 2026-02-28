export function formatCurrency(amount: number): string {
	const sign = amount < 0 ? "-" : ""
	const formatted = new Intl.NumberFormat("ja-JP").format(Math.abs(amount))
	return `${sign}¥${formatted}`
}

export function formatCompactCurrency(amount: number): string {
	if (amount >= 10000) {
		return `${(amount / 10000).toFixed(1)}万`
	}
	return formatCurrency(amount)
}

export function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`
}

export function formatMonth(yearMonth: string): string {
	const month = Number.parseInt(yearMonth.split("-")[1], 10)
	return `${month}月`
}
