"use client"

import { type ChangeEvent, type FormEvent, useRef, useState, useTransition } from "react"
import { importCsv } from "@/server/actions/import-csv"
import { Button } from "@/client/components/ui/Button"

type UploadResult = {
	success: boolean
	message: string
}

export function CsvUploadForm() {
	const [file, setFile] = useState<File | null>(null)
	const [result, setResult] = useState<UploadResult | null>(null)
	const [isPending, startTransition] = useTransition()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] ?? null)
		setResult(null)
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!file) return

		startTransition(async () => {
			const formData = new FormData()
			formData.append("file", file)
			const res = await importCsv(formData)

			if (res.success) {
				setResult({ success: true, message: `${res.importedCount}件インポートしました` })
				setFile(null)
				if (fileInputRef.current) fileInputRef.current.value = ""
			} else {
				setResult({ success: false, message: res.error ?? "インポートに失敗しました" })
			}
		})
	}

	return (
		<form onSubmit={handleSubmit} className="flex items-end gap-3">
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
			<Button type="submit" disabled={!file || isPending}>
				{isPending ? "アップロード中..." : "アップロード"}
			</Button>
			{result && (
				<p className={`text-sm ${result.success ? "text-green-600" : "text-red-600"}`}>
					{result.message}
				</p>
			)}
		</form>
	)
}
