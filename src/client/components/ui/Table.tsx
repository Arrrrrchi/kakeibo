type Column = {
	key: string
	header: string
	className?: string
}

type TableProps = {
	columns: Column[]
	data: Record<string, string | number>[]
	className?: string
}

export function Table({ columns, data, className = "" }: TableProps) {
	return (
		<div className={`overflow-auto ${className}`}>
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-[#1a1a2e] text-white">
						{columns.map((col) => (
							<th
								key={col.key}
								className={`sticky top-0 bg-[#1a1a2e] px-4 py-3 text-left font-medium ${col.className ?? ""}`}
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((row, i) => (
						<tr key={`row-${columns.map((c) => row[c.key]).join("-")}-${i}`} className="border-b hover:bg-gray-50">
							{columns.map((col) => (
								<td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
									{row[col.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
