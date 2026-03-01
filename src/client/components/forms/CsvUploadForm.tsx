"use client"

import { type ChangeEvent, type FormEvent, useRef, useState, useTransition } from "react"
import { Button } from "@/client/components/ui/Button"
import { useToast } from "@/client/components/ui/Toast"
import { importCsvFiles } from "@/server/actions/import-csv"
import type { MultiImportResult } from "@/types/action"

export function CsvUploadForm() {
	const [files, setFiles] = useState<File[]>([])
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<MultiImportResult | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { showToast } = useToast()

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files
		if (selected) {
			setFiles(Array.from(selected))
			setResult(null)
		}
	}

	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (files.length === 0) return

		startTransition(async () => {
			const formData = new FormData()
			for (const file of files) {
				formData.append("files", file)
			}
			const res = await importCsvFiles(formData)

			if (res.success) {
				showToast(`${res.data.totalImported}件インポートしました`, "success")
				setResult(res.data)
				setFiles([])
				if (fileInputRef.current) fileInputRef.current.value = ""
			} else {
				showToast(res.error, "error")
			}
		})
	}

	return (
		<div>
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
						multiple
						onChange={handleFileChange}
						className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
					/>
				</div>
				<Button type="submit" disabled={files.length === 0} loading={isPending}>
					{isPending ? "インポート中..." : "アップロード"}
				</Button>
			</form>

			{files.length > 0 && (
				<ul className="mt-2 space-y-1">
					{files.map((file, index) => (
						<li key={`${file.name}-${index}`} className="flex items-center gap-2 text-sm">
							<span>{file.name}</span>
							<span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
							<button
								type="button"
								aria-label={`${file.name}を削除`}
								onClick={() => handleRemoveFile(index)}
								className="text-gray-400 hover:text-red-500 text-xs"
							>
								&times;
							</button>
						</li>
					))}
				</ul>
			)}

			{result && (
				<ul className="mt-2 space-y-1 text-sm">
					{result.fileResults.map((r) => (
						<li key={r.fileName} className="flex items-center gap-2">
							{r.success ? (
								<span className="text-green-600">
									{r.fileName}: {r.importedCount}件
								</span>
							) : (
								<span className="text-red-600">
									{r.fileName}: {r.error}
								</span>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
