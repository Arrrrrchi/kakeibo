import { DashboardTabs } from "@/client/components/dashboard/DashboardTabs";
import { DateRangeFilter } from "@/client/components/dashboard/DateRangeFilter";
import { CsvUploadForm } from "@/client/components/forms/CsvUploadForm";
import { parseDateRange } from "@/server/lib/date-range";
import { loadDashboardData } from "@/server/loaders/load-dashboard-data";

export const dynamic = "force-dynamic";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: Props) {
	const sp = await searchParams;
	const dateRange = parseDateRange(sp);
	const data = await loadDashboardData(dateRange);

	return (
		<div className="p-4 sm:p-6 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
				<CsvUploadForm />
			</div>
			<DateRangeFilter initialFrom={dateRange?.from} initialTo={dateRange?.to} />
			<DashboardTabs dashboardData={data} />
		</div>
	);
}
