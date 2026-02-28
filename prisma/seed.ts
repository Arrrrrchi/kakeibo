import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { seedData } from "./seed-data"

async function main() {
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
	const prisma = new PrismaClient({ adapter })

	const existingCount = await prisma.budgetItem.count()
	if (existingCount > 0) {
		console.log(`既に ${existingCount} 件の予算項目が存在するためシードをスキップします`)
		return
	}

	for (const item of seedData) {
		await prisma.budgetItem.create({
			data: {
				name: item.name,
				monthlyAmount: item.monthlyAmount,
				cycleType: item.cycleType,
				sortOrder: item.sortOrder,
				mappings: {
					create: item.mappings.map((m) => ({
						majorCategory: m.majorCategory,
						minorCategory: m.minorCategory,
					})),
				},
			},
		})
	}

	console.log(`${seedData.length} 件の予算項目をシードしました`)
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
