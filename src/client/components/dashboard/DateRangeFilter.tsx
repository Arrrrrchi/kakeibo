"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
	initialFrom?: string; // "YYYY-MM"
	initialTo?: string; // "YYYY-MM"
};

export function DateRangeFilter({ initialFrom = "", initialTo = "" }: Props) {
	const router = useRouter();
	const [from, setFrom] = useState(initialFrom);
	const [to, setTo] = useState(initialTo);

	const isInvalid = !!from !== !!to || (!!from && !!to && from > to);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		const query = params.toString();
		router.push(query ? `/dashboard?${query}` : "/dashboard");
	}

	function handleClear() {
		setFrom("");
		setTo("");
		router.push("/dashboard");
	}

	return (
		<form onSubmit={handleSubmit} className="flex items-center gap-2">
			<label htmlFor="date-range-from" className="text-sm text-gray-600">
				開始年月
			</label>
			<input
				id="date-range-from"
				type="month"
				value={from}
				onChange={(e) => setFrom(e.target.value)}
				aria-label="開始年月"
				className="border rounded px-2 py-1 text-sm"
			/>
			<span className="text-gray-400">〜</span>
			<label htmlFor="date-range-to" className="text-sm text-gray-600">
				終了年月
			</label>
			<input
				id="date-range-to"
				type="month"
				value={to}
				onChange={(e) => setTo(e.target.value)}
				aria-label="終了年月"
				className="border rounded px-2 py-1 text-sm"
			/>
			<button
				type="submit"
				disabled={isInvalid}
				className="px-3 py-1 text-sm bg-[#1a1a2e] text-white rounded disabled:opacity-40"
			>
				絞り込む
			</button>
			<button
				type="button"
				onClick={handleClear}
				className="px-3 py-1 text-sm text-gray-600 border rounded"
			>
				クリア
			</button>
		</form>
	);
}
