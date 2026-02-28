export type MoneyforwardCsvRow = {
	isCalculationTarget: boolean
	date: string
	description: string
	amount: number
	institution: string
	majorCategory: string
	minorCategory: string
	memo: string
	isTransfer: boolean
	moneyforwardId: string
}
