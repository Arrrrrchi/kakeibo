"use client"

import { Button } from "@/client/components/ui/Button"

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const isDatabaseError = error.message.includes("connect")
	const message = isDatabaseError
		? "データベースに接続できません。環境変数を確認してください。"
		: "ダッシュボードの読み込みに失敗しました。"

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
			<h2 className="text-xl font-semibold text-gray-800">エラーが発生しました</h2>
			<p className="text-gray-500 text-center max-w-md">{message}</p>
			{process.env.NODE_ENV === "development" && (
				<pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg max-w-lg overflow-auto">
					{error.message}
				</pre>
			)}
			<Button onClick={reset}>再試行</Button>
		</div>
	)
}
