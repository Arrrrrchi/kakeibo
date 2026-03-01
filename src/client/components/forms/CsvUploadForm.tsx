"use client"

import { type ChangeEvent, type FormEvent, useRef, useState, useTransition } from "react"
import { Button } from "@/client/components/ui/Button"
import { useToast } from "@/client/components/ui/Toast"
import { importCsv } from "@/server/actions/import-csv"

export function CsvUploadForm() {
	const [file, setFile] = useState<File | null>(null)
	const [isPending, startTransition] = useTransition()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { showToast } = useToast()

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] ?? null)
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!file) return

		startTransition(async () => {
			const formData = new FormData()
			formData.append("file", file)
			const res = await importCsv(formData)

			if (res.success) {
				showToast(`${res.data.importedCount}件インポートしました`, "success")
				setFile(null)
				if (fileInputRef.current) fileInputRef.current.value = ""
			} else {
				showToast(res.error, "error")
			}
		})
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
			<div>
				<label htmlFor="csv-file" className="block text-xs text-gray-600 mb-1">
					CSVファイル
				</label>
				<input
					ref={fileInputRef}
					id="csv-file"
					type="file"
					accept=".csv"
					onChange={handleFileChange}
					className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
				/>
			</div>
			<Button type="submit" disabled={!file} loading={isPending}>
				{isPending ? "インポート中..." : "アップロード"}
			</Button>
		</form>
	)
}
