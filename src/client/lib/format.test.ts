import { describe, expect, it } from "vitest";
import { formatCompactCurrency, formatCurrency, formatMonth, formatPercent } from "./format";

describe("formatCurrency", () => {
	it("日本円フォーマットで表示する", () => {
		expect(formatCurrency(10000)).toBe("¥10,000");
		expect(formatCurrency(0)).toBe("¥0");
		expect(formatCurrency(1234567)).toBe("¥1,234,567");
	});

	it("負の値もフォーマットする", () => {
		expect(formatCurrency(-5000)).toBe("-¥5,000");
	});
});

describe("formatCompactCurrency", () => {
	it("1万以上を万単位に短縮する", () => {
		expect(formatCompactCurrency(10000)).toBe("1.0万");
		expect(formatCompactCurrency(150000)).toBe("15.0万");
		expect(formatCompactCurrency(1234567)).toBe("123.5万");
	});

	it("1万未満はそのまま通貨フォーマットする", () => {
		expect(formatCompactCurrency(9999)).toBe("¥9,999");
	});
});

describe("formatPercent", () => {
	it("小数点1桁のパーセント表示にする", () => {
		expect(formatPercent(100)).toBe("100.0%");
		expect(formatPercent(85.678)).toBe("85.7%");
		expect(formatPercent(0)).toBe("0.0%");
	});
});

describe("formatMonth", () => {
	it("YYYY-MM 形式を N月 に変換する", () => {
		expect(formatMonth("2025-04")).toBe("4月");
		expect(formatMonth("2025-12")).toBe("12月");
		expect(formatMonth("2025-01")).toBe("1月");
	});
});
