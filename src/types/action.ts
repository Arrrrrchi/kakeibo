export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

export type FileResult = { fileName: string } & (
	| { success: true; importedCount: number }
	| { success: false; error: string }
)

export type MultiImportResult = {
	totalImported: number
	fileResults: FileResult[]
}
