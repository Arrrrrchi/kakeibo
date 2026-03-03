import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseMoneyforwardCsv } from "./csv-parser";

function createTestCsv(
	rows: {
		date: string;
		description: string;
		amount: number;
		major: string;
		minor: string;
		calc: number;
		transfer: number;
		institution?: string;
		memo?: string;
		id?: string;
	}[],
): Buffer {
	const header = "計算対象,日付,内容,金額（円）,保有金融機関,大項目,中項目,メモ,振替,ID";
	const lines = rows.map(
		(r) =>
			`${r.calc},${r.date},${r.description},${r.amount},${r.institution ?? ""},${r.major},${r.minor},${r.memo ?? ""},${r.transfer},${r.id ?? ""}`,
	);
	const csv = [header, ...lines].join("\r\n");
	return Buffer.from(csv, "utf-8");
}

function createHeaderOnlyCsv(): Buffer {
	const header = "計算対象,日付,内容,金額（円）,保有金融機関,大項目,中項目,メモ,振替,ID";
	return Buffer.from(header, "utf-8");
}

async function readFixture(filename: string): Promise<Buffer> {
	const filepath = path.resolve(__dirname, "../../test/fixtures", filename);
	return fs.promises.readFile(filepath);
}

describe("parseMoneyforwardCsv", () => {
	describe("正常系", () => {
		it("支出行をパースして絶対値の金額で返す", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "東京電力",
					amount: -8500,
					major: "水道・光熱費",
					minor: "電気代",
					calc: 1,
					transfer: 0,
					institution: "三井住友銀行",
					id: "mf001",
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(8500);
			expect(result[0].isIncome).toBe(false);
			expect(result[0].majorCategory).toBe("水道・光熱費");
			expect(result[0].minorCategory).toBe("電気代");
			expect(result[0].description).toBe("東京電力");
			expect(result[0].institution).toBe("三井住友銀行");
		});

		it("収入行をパースして isIncome: true で返す", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/25",
					description: "給与",
					amount: 300000,
					major: "収入",
					minor: "給与",
					calc: 1,
					transfer: 0,
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(300000);
			expect(result[0].isIncome).toBe(true);
		});

		it("同一データから同じ importHash を生成する（冪等性）", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "東京電力",
					amount: -8500,
					major: "水道・光熱費",
					minor: "電気代",
					calc: 1,
					transfer: 0,
					id: "mf001",
				},
			]);
			const result1 = await parseMoneyforwardCsv(csv);
			const result2 = await parseMoneyforwardCsv(csv);

			expect(result1[0].importHash).toBe(result2[0].importHash);
			expect(result1[0].importHash).toMatch(/^[a-f0-9]{64}$/);
		});

		it("複数行を正しくパースする", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "東京電力",
					amount: -8500,
					major: "水道・光熱費",
					minor: "電気代",
					calc: 1,
					transfer: 0,
				},
				{
					date: "2025/04/20",
					description: "スーパー",
					amount: -3000,
					major: "食費",
					minor: "食料品",
					calc: 1,
					transfer: 0,
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(2);
		});

		it("date を Date オブジェクトに変換する", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "テスト",
					amount: -1000,
					major: "食費",
					minor: "外食",
					calc: 1,
					transfer: 0,
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result[0].date).toBeInstanceOf(Date);
			expect(result[0].date.getFullYear()).toBe(2025);
			expect(result[0].date.getMonth()).toBe(3); // 0-indexed
			expect(result[0].date.getDate()).toBe(15);
		});
	});

	describe("フィルタリング", () => {
		it("振替行を isTransfer: true として保存する（計算対象=1）", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/01",
					description: "振替 SBI証券 (20250401012345678)",
					amount: -50000,
					major: "振替",
					minor: "振替",
					calc: 1,
					transfer: 1,
					institution: "住信SBIネット銀行",
					id: "mf-transfer-001",
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].isTransfer).toBe(true);
			expect(result[0].amount).toBe(50000);
			expect(result[0].description).toBe("振替 SBI証券 (20250401012345678)");
		});

		it("振替行を isTransfer: true として保存する（計算対象=0の場合も）", async () => {
			const csv = createTestCsv([
				{
					date: "2025/05/01",
					description: "振替 SBI証券 (20250501012345678)",
					amount: -50000,
					major: "振替",
					minor: "振替",
					calc: 0,
					transfer: 1,
					institution: "住信SBIネット銀行",
					id: "mf-transfer-002",
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].isTransfer).toBe(true);
			expect(result[0].amount).toBe(50000);
		});

		it("通常行は isTransfer: false で保存する", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "東京電力",
					amount: -8500,
					major: "水道・光熱費",
					minor: "電気代",
					calc: 1,
					transfer: 0,
					institution: "三井住友銀行",
					id: "mf001",
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].isTransfer).toBe(false);
		});

		it("計算対象外かつ振替でない行を除外する", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/01",
					description: "対象外",
					amount: -1000,
					major: "その他",
					minor: "その他",
					calc: 0,
					transfer: 0,
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(0);
		});
	});

	describe("エッジケース", () => {
		it("空の CSV は空の配列を返す", async () => {
			const csv = createHeaderOnlyCsv();
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(0);
		});

		it("memo と institution が空文字の場合は null を返す", async () => {
			const csv = createTestCsv([
				{
					date: "2025/04/15",
					description: "テスト",
					amount: -1000,
					major: "食費",
					minor: "外食",
					calc: 1,
					transfer: 0,
				},
			]);
			const result = await parseMoneyforwardCsv(csv);

			expect(result[0].institution).toBeNull();
			expect(result[0].memo).toBeNull();
		});

		it("ヘッダーがダブルクォートで囲まれた CSV をパースできる", async () => {
			const header =
				'"計算対象","日付","内容","金額（円）","保有金融機関","大項目","中項目","メモ","振替","ID"';
			const dataLine =
				'"1","2025/04/30","東京電力","-12681","楽天カード","水道・光熱費","電気代","","0","test-id"';
			const csv = Buffer.from(`${header}\r\n${dataLine}`, "utf-8");
			const result = await parseMoneyforwardCsv(csv);

			expect(result).toHaveLength(1);
			expect(result[0].description).toBe("東京電力");
			expect(result[0].amount).toBe(12681);
			expect(result[0].majorCategory).toBe("水道・光熱費");
			expect(result[0].minorCategory).toBe("電気代");
		});

		it("日本語が文字化けしない（cp932 エンコーディング）", async () => {
			const buffer = await readFixture("sample.csv");
			const result = await parseMoneyforwardCsv(buffer);

			const hasJapanese = result.some((t) => /[\u3000-\u9fff]/.test(t.description));
			expect(hasJapanese).toBe(true);
		});
	});
});
