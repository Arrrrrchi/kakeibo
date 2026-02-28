import "server-only"

import { createHash } from "node:crypto"
import type { TransactionCreateInput } from "@/types/transaction"

export async function parseMoneyforwardCsv(buffer: Buffer): Promise<TransactionCreateInput[]> {
	const text = decodeBuffer(buffer)
	const lines = text.split(/\r?\n/)

	if (lines.length <= 1) {
		return []
	}

	const headers = parseHeaderLine(lines[0])
	const transactions: TransactionCreateInput[] = []

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		const row = parseLine(line, headers)
		if (!row) continue
		if (!row.isCalculationTarget || row.isTransfer) continue

		const isIncome = row.amount > 0

		transactions.push({
			date: new Date(row.date),
			description: row.description,
			amount: Math.abs(row.amount),
			majorCategory: row.majorCategory,
			minorCategory: row.minorCategory,
			institution: row.institution || null,
			memo: row.memo || null,
			moneyforwardId: row.moneyforwardId || null,
			isIncome,
			importHash: generateHash(row),
		})
	}

	return transactions
}

function decodeBuffer(buffer: Buffer): string {
	const bytes = new Uint8Array(buffer)

	try {
		const utf8Text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
		return utf8Text
	} catch {
		const decoder = new TextDecoder("shift-jis")
		return decoder.decode(bytes)
	}
}

type ColumnIndices = {
	calc: number
	date: number
	description: number
	amount: number
	institution: number
	major: number
	minor: number
	memo: number
	transfer: number
	id: number
}

const COLUMN_MAP: Record<string, keyof ColumnIndices> = {
	計算対象: "calc",
	日付: "date",
	内容: "description",
	"金額（円）": "amount",
	保有金融機関: "institution",
	大項目: "major",
	中項目: "minor",
	メモ: "memo",
	振替: "transfer",
	ID: "id",
}

function parseHeaderLine(headerLine: string): ColumnIndices {
	const columns = headerLine.split(",")
	const indices = {} as ColumnIndices

	for (let i = 0; i < columns.length; i++) {
		const col = columns[i].trim()
		const key = COLUMN_MAP[col]
		if (key) {
			indices[key] = i
		}
	}

	return indices
}

type ParsedRow = {
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

function parseLine(line: string, headers: ColumnIndices): ParsedRow | null {
	const fields = splitCsvLine(line)
	if (fields.length <= 1) return null

	return {
		isCalculationTarget: fields[headers.calc] === "1",
		date: fields[headers.date],
		description: fields[headers.description],
		amount: Number.parseInt(fields[headers.amount], 10),
		institution: fields[headers.institution] ?? "",
		majorCategory: fields[headers.major],
		minorCategory: fields[headers.minor],
		memo: fields[headers.memo] ?? "",
		isTransfer: fields[headers.transfer] === "1",
		moneyforwardId: fields[headers.id] ?? "",
	}
}

function splitCsvLine(line: string): string[] {
	const fields: string[] = []
	let current = ""
	let inQuotes = false

	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes
		} else if (char === "," && !inQuotes) {
			fields.push(current)
			current = ""
		} else {
			current += char
		}
	}
	fields.push(current)

	return fields
}

function generateHash(row: ParsedRow): string {
	const input = `${row.date}|${row.description}|${row.amount}|${row.institution}|${row.moneyforwardId}`
	return createHash("sha256").update(input).digest("hex")
}
