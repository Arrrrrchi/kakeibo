import { NextResponse } from "next/server";
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import type { CategoryMapping } from "@/types/budget";

function isCategoryMappingArray(parsed: unknown): parsed is CategoryMapping[] {
	return (
		Array.isArray(parsed) &&
		parsed.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				typeof (item as Record<string, unknown>).majorCategory === "string" &&
				typeof (item as Record<string, unknown>).minorCategory === "string",
		)
	);
}

export async function GET(req: Request): Promise<NextResponse> {
	const { searchParams } = new URL(req.url);
	const mappingsParam = searchParams.get("mappings");
	const month = searchParams.get("month");

	if (!mappingsParam || !month) {
		return NextResponse.json({ error: "mappings と month は必須です" }, { status: 400 });
	}

	if (!/^\d{4}-\d{2}$/.test(month)) {
		return NextResponse.json({ error: "month は YYYY-MM 形式で指定してください" }, { status: 400 });
	}
	const mm = Number(month.split("-")[1]);
	if (mm < 1 || mm > 12) {
		return NextResponse.json({ error: "month は YYYY-MM 形式で指定してください" }, { status: 400 });
	}

	let mappings: CategoryMapping[];
	try {
		const parsed: unknown = JSON.parse(mappingsParam);
		if (!isCategoryMappingArray(parsed)) {
			return NextResponse.json({ error: "mappings の形式が不正です" }, { status: 400 });
		}
		mappings = parsed;
	} catch {
		return NextResponse.json({ error: "mappings の形式が不正です" }, { status: 400 });
	}

	try {
		const repo = new PrismaTransactionRepository();
		const results = await Promise.all(
			mappings.map((m) => repo.findByCategoryAndMonth(m.majorCategory, m.minorCategory, month)),
		);
		const transactions = results
			.flat()
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return NextResponse.json(transactions);
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "取引データの取得に失敗しました" }, { status: 500 });
	}
}
