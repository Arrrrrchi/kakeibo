import { DashboardTabs } from "@/client/components/dashboard/DashboardTabs"
import { CsvUploadForm } from "@/client/components/forms/CsvUploadForm"
import { loadDashboardData } from "@/server/loaders/load-dashboard-data"

export default async function DashboardPage() {
	const data = await loadDashboardData()

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
				<CsvUploadForm />
			</div>
			<DashboardTabs dashboardData={data} />
		</div>
	)
}
