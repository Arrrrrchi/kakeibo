"use client"

import { Button } from "@/client/components/ui/Button"

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
			<h2 className="text-xl font-semibold text-gray-800">エラーが発生しました</h2>
			<p className="text-gray-500 text-center max-w-md">
				予期しないエラーが発生しました。再試行してください。
			</p>
			{process.env.NODE_ENV === "development" && (
				<pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg max-w-lg overflow-auto">
					{error.message}
				</pre>
			)}
			<Button onClick={reset}>再試行</Button>
		</div>
	)
}
