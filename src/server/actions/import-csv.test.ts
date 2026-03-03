import { describe, expect, it, vi } from "vitest";
import { importCsvFiles } from "@/server/actions/import-csv";

const mockUpsertMany = vi.fn().mockResolvedValue(0);

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

const mockParseCsv = vi.fn().mockResolvedValue([]);

vi.mock("@/server/lib/csv-parser", () => ({
	parseMoneyforwardCsv: (...args: unknown[]) => mockParseCsv(...args),
}));

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {
		upsertMany = mockUpsertMany;
	},
}));

describe("importCsvFiles", () => {
	it("ファイルが0件の場合はエラーを返す", async () => {
		const formData = new FormData();
		const result = await importCsvFiles(formData);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("ファイル");
		}
	});

	it("合計サイズが50MBを超える場合はエラーを返す", async () => {
		const formData = new FormData();
		const largeFile1 = new File([new ArrayBuffer(30 * 1024 * 1024)], "large1.csv");
		const largeFile2 = new File([new ArrayBuffer(25 * 1024 * 1024)], "large2.csv");
		formData.append("files", largeFile1);
		formData.append("files", largeFile2);

		const result = await importCsvFiles(formData);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("ファイルサイズ");
		}
	});

	it("単一ファイルの正常インポート", async () => {
		mockParseCsv.mockResolvedValue([{ date: new Date(), description: "test", amount: 100 }]);
		mockUpsertMany.mockResolvedValue(3);

		const file = new File(["test,data"], "test.csv");
		const formData = new FormData();
		formData.append("files", file);

		const result = await importCsvFiles(formData);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.totalImported).toBe(3);
			expect(result.data.fileResults).toHaveLength(1);
			expect(result.data.fileResults[0].fileName).toBe("test.csv");
			expect(result.data.fileResults[0].success).toBe(true);
		}
	});

	it("複数ファイルの正常インポート", async () => {
		mockParseCsv.mockResolvedValue([{ date: new Date(), description: "test", amount: 100 }]);
		mockUpsertMany.mockResolvedValueOnce(3).mockResolvedValueOnce(5);

		const file1 = new File(["data1"], "2025-04.csv");
		const file2 = new File(["data2"], "2025-05.csv");
		const formData = new FormData();
		formData.append("files", file1);
		formData.append("files", file2);

		const result = await importCsvFiles(formData);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.totalImported).toBe(8);
			expect(result.data.fileResults).toHaveLength(2);
		}
	});

	it("一部ファイルが不正でも正常なファイルは処理される", async () => {
		mockParseCsv
			.mockResolvedValueOnce([]) // 1つ目: 0件
			.mockResolvedValueOnce([{ date: new Date(), description: "test", amount: 100 }]);
		mockUpsertMany.mockResolvedValue(4);

		const badFile = new File(["invalid"], "bad.csv");
		const goodFile = new File(["valid,data"], "good.csv");
		const formData = new FormData();
		formData.append("files", badFile);
		formData.append("files", goodFile);

		const result = await importCsvFiles(formData);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.totalImported).toBe(4);
			expect(result.data.fileResults[0].success).toBe(false);
			expect(result.data.fileResults[1].success).toBe(true);
		}
	});

	it("全ファイルが不正な場合はエラーを返す", async () => {
		mockParseCsv.mockResolvedValue([]);

		const bad1 = new File(["invalid1"], "bad1.csv");
		const bad2 = new File(["invalid2"], "bad2.csv");
		const formData = new FormData();
		formData.append("files", bad1);
		formData.append("files", bad2);

		const result = await importCsvFiles(formData);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("インポートできるデータがありません");
		}
	});
});
