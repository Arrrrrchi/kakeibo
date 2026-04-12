import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/types/transaction";

// server-only をモック
vi.mock("server-only", () => ({}));

const mockFindByCategoryAndMonth = vi.fn();

// PrismaTransactionRepository をモックして route.ts が使う依存を差し替える
vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {
		findByCategoryAndMonth = mockFindByCategoryAndMonth;
	},
}));

const mockTransactions: Transaction[] = [
	{
		id: "tx-1",
		date: new Date("2026-03-05"),
		description: "スーパー",
		amount: 1500,
		majorCategory: "食費",
		minorCategory: "外食",
		institution: null,
		memo: null,
		moneyforwardId: null,
		isIncome: false,
		isTransfer: false,
		importHash: "hash1",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

describe("GET /api/transactions", () => {
	let GET: (req: Request) => Promise<Response>;

	beforeAll(async () => {
		({ GET } = await import("./route"));
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("mappings と month を受け取り取引一覧を返す", async () => {
		mockFindByCategoryAndMonth.mockResolvedValue(mockTransactions);

		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026-03`,
		);
		const req = new Request(url);

		const res = await GET(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(mockFindByCategoryAndMonth).toHaveBeenCalledWith("食費", "外食", "2026-03");
		expect(body).toHaveLength(1);
		expect(body[0].id).toBe("tx-1");
	});

	it("mappings パラメータがない場合 400 を返す", async () => {
		const url = new URL("http://localhost/api/transactions?month=2026-03");
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("month パラメータがない場合 400 を返す", async () => {
		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}`,
		);
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("複数の mappings がある場合すべてのカテゴリで検索する", async () => {
		mockFindByCategoryAndMonth.mockResolvedValue([]);

		const mappings = [
			{ majorCategory: "食費", minorCategory: "外食" },
			{ majorCategory: "水道・光熱費", minorCategory: "電気代" },
		];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026-03`,
		);
		const req = new Request(url);

		await GET(req);

		expect(mockFindByCategoryAndMonth).toHaveBeenCalledTimes(2);
		expect(mockFindByCategoryAndMonth).toHaveBeenCalledWith("食費", "外食", "2026-03");
		expect(mockFindByCategoryAndMonth).toHaveBeenCalledWith("水道・光熱費", "電気代", "2026-03");
	});

	it("month が年のみ（YYYY）の場合 400 を返す", async () => {
		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026`,
		);
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("month のゼロパディングなし（YYYY-M）の場合 400 を返す", async () => {
		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026-3`,
		);
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("month が日付形式（YYYY-MM-DD）の場合 400 を返す", async () => {
		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026-03-01`,
		);
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("リポジトリがエラーをスローした場合 500 を返す", async () => {
		mockFindByCategoryAndMonth.mockRejectedValue(new Error("DB error"));

		const mappings = [{ majorCategory: "食費", minorCategory: "外食" }];
		const url = new URL(
			`http://localhost/api/transactions?mappings=${encodeURIComponent(JSON.stringify(mappings))}&month=2026-03`,
		);
		const req = new Request(url);

		const res = await GET(req);

		expect(res.status).toBe(500);
	});
});
