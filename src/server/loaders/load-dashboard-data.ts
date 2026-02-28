import "server-only"

import { PrismaBudgetRepository } from "@/server/repositories/prisma-budget.repository"
import { PrismaMappingRepository } from "@/server/repositories/prisma-mapping.repository"
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import { GetDashboardSummaryUsecase } from "@/server/usecases/get-dashboard-summary.usecase"
import type { DashboardData } from "@/types/dashboard"

export async function loadDashboardData(): Promise<DashboardData> {
	const usecase = new GetDashboardSummaryUsecase(
		new PrismaTransactionRepository(),
		new PrismaBudgetRepository(),
		new PrismaMappingRepository(),
	)
	return usecase.execute()
}
