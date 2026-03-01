import { DashboardTabs } from "@/client/components/dashboard/DashboardTabs"
import { CsvUploadForm } from "@/client/components/forms/CsvUploadForm"
import { loadDashboardData } from "@/server/loaders/load-dashboard-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
	const data = await loadDashboardData()

	return (
		<div className="p-4 sm:p-6 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
				<CsvUploadForm />
			</div>
			<DashboardTabs dashboardData={data} />
		</div>
	)
}
