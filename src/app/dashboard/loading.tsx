export default function DashboardLoading() {
	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
				<div className="h-10 w-60 bg-gray-200 rounded animate-pulse" />
			</div>

			<div className="bg-white rounded-xl p-1 shadow-sm">
				<div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={`kpi-skeleton-${i}`} className="bg-white rounded-xl p-5 shadow-sm space-y-2">
						<div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
						<div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
						<div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={`chart-skeleton-${i}`} className="bg-white rounded-xl p-5 shadow-sm">
						<div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
						<div className="h-[300px] bg-gray-100 rounded animate-pulse" />
					</div>
				))}
			</div>
		</div>
	)
}
