import { describe, expect, it } from "vitest";
import {
	CYCLE_TYPE_COLOR,
	CYCLE_TYPE_LABEL,
	CYCLE_TYPE_ORDER,
	getCycleTypeColor,
	getCycleTypeLabel,
	UNCLASSIFIED_COLOR,
	UNCLASSIFIED_KEY,
	UNCLASSIFIED_LABEL,
} from "@/client/lib/cycle-type";
import type { CycleType } from "@/generated/prisma/enums";

describe("CYCLE_TYPE_LABEL", () => {
	it("monthly_fixed のラベルが「毎月の固定支出」であること", () => {
		expect(CYCLE_TYPE_LABEL.monthly_fixed).toBe("毎月の固定支出");
	});

	it("monthly_variable のラベルが「毎月の変動支出」であること", () => {
		expect(CYCLE_TYPE_LABEL.monthly_variable).toBe("毎月の変動支出");
	});

	it("irregular_fixed のラベルが「単発の固定支出」であること", () => {
		expect(CYCLE_TYPE_LABEL.irregular_fixed).toBe("単発の固定支出");
	});

	it("irregular_variable のラベルが「単発の変動支出」であること", () => {
		expect(CYCLE_TYPE_LABEL.irregular_variable).toBe("単発の変動支出");
	});
});

describe("CYCLE_TYPE_COLOR", () => {
	it("4 CycleType すべてで HEX カラーコードが返ること", () => {
		const hexPattern = /^#[0-9a-fA-F]{6}$/;
		const types: CycleType[] = [
			"monthly_fixed",
			"monthly_variable",
			"irregular_fixed",
			"irregular_variable",
		];
		for (const type of types) {
			expect(CYCLE_TYPE_COLOR[type]).toMatch(hexPattern);
		}
	});
});

describe("CYCLE_TYPE_ORDER", () => {
	it("長さが 4 であること", () => {
		expect(CYCLE_TYPE_ORDER).toHaveLength(4);
	});

	it("重複がないこと", () => {
		const unique = new Set(CYCLE_TYPE_ORDER);
		expect(unique.size).toBe(CYCLE_TYPE_ORDER.length);
	});

	it("4 つの CycleType をすべて含むこと", () => {
		const expected: CycleType[] = [
			"monthly_fixed",
			"monthly_variable",
			"irregular_fixed",
			"irregular_variable",
		];
		for (const type of expected) {
			expect(CYCLE_TYPE_ORDER).toContain(type);
		}
	});
});

describe("UNCLASSIFIED 定数", () => {
	it("UNCLASSIFIED_KEY が 'unclassified' であること", () => {
		expect(UNCLASSIFIED_KEY).toBe("unclassified");
	});

	it("UNCLASSIFIED_LABEL が '未分類' であること", () => {
		expect(UNCLASSIFIED_LABEL).toBe("未分類");
	});

	it("UNCLASSIFIED_COLOR が HEX カラーコードであること", () => {
		expect(UNCLASSIFIED_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});

describe("getCycleTypeLabel", () => {
	it("4 CycleType すべてで期待ラベルを返すこと", () => {
		expect(getCycleTypeLabel("monthly_fixed")).toBe("毎月の固定支出");
		expect(getCycleTypeLabel("monthly_variable")).toBe("毎月の変動支出");
		expect(getCycleTypeLabel("irregular_fixed")).toBe("単発の固定支出");
		expect(getCycleTypeLabel("irregular_variable")).toBe("単発の変動支出");
	});

	it("不正な値の場合はフォールバック文字列を返すこと", () => {
		const result = getCycleTypeLabel("unknown" as CycleType);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});
});

describe("getCycleTypeColor", () => {
	it("4 CycleType すべてで HEX カラーコードを返すこと", () => {
		const hexPattern = /^#[0-9a-fA-F]{6}$/;
		expect(getCycleTypeColor("monthly_fixed")).toMatch(hexPattern);
		expect(getCycleTypeColor("monthly_variable")).toMatch(hexPattern);
		expect(getCycleTypeColor("irregular_fixed")).toMatch(hexPattern);
		expect(getCycleTypeColor("irregular_variable")).toMatch(hexPattern);
	});

	it("不正な値の場合はフォールバックカラーを返すこと", () => {
		const result = getCycleTypeColor("unknown" as CycleType);
		expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});
