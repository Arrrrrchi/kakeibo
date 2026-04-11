import { describe, expect, it } from "vitest";
import { parseDateRange } from "@/server/lib/date-range";

describe("parseDateRange", () => {
	describe("正常系", () => {
		it("from < to の場合は DateRange を返す", () => {
			const result = parseDateRange({ from: "2024-01", to: "2024-12" });
			expect(result).toEqual({ from: "2024-01", to: "2024-12" });
		});

		it("from === to の場合は DateRange を返す", () => {
			const result = parseDateRange({ from: "2024-06", to: "2024-06" });
			expect(result).toEqual({ from: "2024-06", to: "2024-06" });
		});

		it("年をまたぐ範囲でも DateRange を返す", () => {
			const result = parseDateRange({ from: "2023-10", to: "2024-03" });
			expect(result).toEqual({ from: "2023-10", to: "2024-03" });
		});
	});

	describe("フォーマット不正", () => {
		it("from のフォーマットが不正な場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-1", to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("to のフォーマットが不正な場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-01", to: "2024-13" });
			expect(result).toBeUndefined();
		});

		it("from が不正な月（0）の場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-00", to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("from が YYYY-MM 形式でない場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024/01", to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("from が空文字の場合は undefined を返す", () => {
			const result = parseDateRange({ from: "", to: "2024-12" });
			expect(result).toBeUndefined();
		});
	});

	describe("片方欠落", () => {
		it("from のみ指定した場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-01" });
			expect(result).toBeUndefined();
		});

		it("to のみ指定した場合は undefined を返す", () => {
			const result = parseDateRange({ to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("from が undefined の場合は undefined を返す", () => {
			const result = parseDateRange({ from: undefined, to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("to が undefined の場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-01", to: undefined });
			expect(result).toBeUndefined();
		});

		it("両方 undefined の場合は undefined を返す", () => {
			const result = parseDateRange({});
			expect(result).toBeUndefined();
		});
	});

	describe("from > to の場合", () => {
		it("from が to より後の月の場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-12", to: "2024-01" });
			expect(result).toBeUndefined();
		});

		it("from の年が to の年より大きい場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2025-01", to: "2024-12" });
			expect(result).toBeUndefined();
		});
	});

	describe("配列混入", () => {
		it("from が配列の場合は undefined を返す", () => {
			const result = parseDateRange({ from: ["2024-01", "2024-02"], to: "2024-12" });
			expect(result).toBeUndefined();
		});

		it("to が配列の場合は undefined を返す", () => {
			const result = parseDateRange({ from: "2024-01", to: ["2024-12", "2024-11"] });
			expect(result).toBeUndefined();
		});

		it("from と to 両方が配列の場合は undefined を返す", () => {
			const result = parseDateRange({
				from: ["2024-01", "2024-02"],
				to: ["2024-12", "2024-11"],
			});
			expect(result).toBeUndefined();
		});
	});
});
