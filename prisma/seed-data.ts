import type { CycleType } from "@/generated/prisma/enums"

export type SeedItem = {
	name: string
	monthlyAmount: number
	cycleType: CycleType
	sortOrder: number
	mappings: { majorCategory: string; minorCategory: string }[]
}

export const seedData: SeedItem[] = [
	// 毎月・固定（sortOrder: 100〜）
	{
		name: "住宅（家賃）",
		monthlyAmount: 70700,
		cycleType: "monthly_fixed",
		sortOrder: 100,
		mappings: [],
	},
	{
		name: "電気代",
		monthlyAmount: 10000,
		cycleType: "monthly_fixed",
		sortOrder: 101,
		mappings: [{ majorCategory: "水道・光熱費", minorCategory: "電気代" }],
	},
	{
		name: "ガス代",
		monthlyAmount: 10000,
		cycleType: "monthly_fixed",
		sortOrder: 102,
		mappings: [{ majorCategory: "水道・光熱費", minorCategory: "ガス・灯油代" }],
	},
	{
		name: "水道代",
		monthlyAmount: 4000,
		cycleType: "monthly_fixed",
		sortOrder: 103,
		mappings: [{ majorCategory: "水道・光熱費", minorCategory: "水道代" }],
	},
	{
		name: "共同生活費",
		monthlyAmount: 55000,
		cycleType: "monthly_fixed",
		sortOrder: 104,
		mappings: [{ majorCategory: "食費", minorCategory: "共同生活費" }],
	},
	{
		name: "通信費（光回線）",
		monthlyAmount: 5000,
		cycleType: "monthly_fixed",
		sortOrder: 105,
		mappings: [{ majorCategory: "通信費", minorCategory: "インターネット" }],
	},
	{
		name: "通信費（スマホ）",
		monthlyAmount: 3800,
		cycleType: "monthly_fixed",
		sortOrder: 106,
		mappings: [{ majorCategory: "通信費", minorCategory: "携帯電話" }],
	},
	{
		name: "iPhone 端末分割",
		monthlyAmount: 3250,
		cycleType: "monthly_fixed",
		sortOrder: 107,
		mappings: [
			{ majorCategory: "特別な支出", minorCategory: "スマホ本体" },
			{ majorCategory: "特別な支出", minorCategory: "スマホ分割払い" },
		],
	},
	{
		name: "奨学金返済",
		monthlyAmount: 23300,
		cycleType: "monthly_fixed",
		sortOrder: 108,
		mappings: [{ majorCategory: "その他", minorCategory: "奨学金返済" }],
	},
	{
		name: "コンタクトレンズ",
		monthlyAmount: 6160,
		cycleType: "monthly_fixed",
		sortOrder: 109,
		mappings: [],
	},
	{
		name: "リベシティ",
		monthlyAmount: 3000,
		cycleType: "monthly_fixed",
		sortOrder: 110,
		mappings: [{ majorCategory: "教養・教育", minorCategory: "リベシティ" }],
	},
	{
		name: "おこづかい（2人分）",
		monthlyAmount: 60000,
		cycleType: "monthly_fixed",
		sortOrder: 111,
		mappings: [{ majorCategory: "趣味・娯楽", minorCategory: "おこづかい" }],
	},

	// 毎月・変動（sortOrder: 200〜）
	{
		name: "薬代",
		monthlyAmount: 2000,
		cycleType: "monthly_variable",
		sortOrder: 200,
		mappings: [{ majorCategory: "健康・医療", minorCategory: "薬" }],
	},
	{
		name: "美容室（2人分）",
		monthlyAmount: 10000,
		cycleType: "monthly_variable",
		sortOrder: 201,
		mappings: [{ majorCategory: "衣服・美容", minorCategory: "美容院・理髪" }],
	},
	{
		name: "洋服（2人分）",
		monthlyAmount: 8000,
		cycleType: "monthly_variable",
		sortOrder: 202,
		mappings: [{ majorCategory: "衣服・美容", minorCategory: "衣服" }],
	},
	{
		name: "マッサージ（麻衣）",
		monthlyAmount: 5000,
		cycleType: "monthly_variable",
		sortOrder: 203,
		mappings: [{ majorCategory: "健康・医療", minorCategory: "ボディケア" }],
	},
	{
		name: "交通費",
		monthlyAmount: 12000,
		cycleType: "monthly_variable",
		sortOrder: 204,
		mappings: [{ majorCategory: "交通費", minorCategory: "交通費" }],
	},
	{
		name: "駐車場",
		monthlyAmount: 1000,
		cycleType: "monthly_variable",
		sortOrder: 205,
		mappings: [{ majorCategory: "自動車", minorCategory: "駐車場" }],
	},
	{
		name: "ガソリン（2人分）",
		monthlyAmount: 12000,
		cycleType: "monthly_variable",
		sortOrder: 206,
		mappings: [
			{ majorCategory: "自動車", minorCategory: "ガソリン" },
			{ majorCategory: "自動車", minorCategory: "オカプリチャージ" },
		],
	},

	// 不定期・固定（sortOrder: 300〜）
	{
		name: "火災保険",
		monthlyAmount: 750,
		cycleType: "irregular_fixed",
		sortOrder: 300,
		mappings: [],
	},
	{
		name: "町内費",
		monthlyAmount: 842,
		cycleType: "irregular_fixed",
		sortOrder: 301,
		mappings: [{ majorCategory: "住宅", minorCategory: "その他住宅" }],
	},
	{
		name: "Github Copilot",
		monthlyAmount: 1227,
		cycleType: "irregular_fixed",
		sortOrder: 302,
		mappings: [],
	},
	{
		name: "パスワード管理",
		monthlyAmount: 350,
		cycleType: "irregular_fixed",
		sortOrder: 303,
		mappings: [],
	},
	{
		name: "Amazon プライム",
		monthlyAmount: 492,
		cycleType: "irregular_fixed",
		sortOrder: 304,
		mappings: [],
	},
	{
		name: "エックスサーバー",
		monthlyAmount: 157,
		cycleType: "irregular_fixed",
		sortOrder: 305,
		mappings: [{ majorCategory: "通信費", minorCategory: "その他通信費" }],
	},
	{
		name: "自動車税（2台分）",
		monthlyAmount: 3775,
		cycleType: "irregular_fixed",
		sortOrder: 306,
		mappings: [{ majorCategory: "自動車", minorCategory: "自動車税" }],
	},
	{
		name: "自動車保険",
		monthlyAmount: 1501,
		cycleType: "irregular_fixed",
		sortOrder: 307,
		mappings: [{ majorCategory: "自動車", minorCategory: "自動車保険" }],
	},
	{
		name: "NHK",
		monthlyAmount: 1817,
		cycleType: "irregular_fixed",
		sortOrder: 308,
		mappings: [{ majorCategory: "水道・光熱費", minorCategory: "NHK" }],
	},

	// 不定期・変動（sortOrder: 400〜）
	{
		name: "旅行費",
		monthlyAmount: 26667,
		cycleType: "irregular_variable",
		sortOrder: 400,
		mappings: [
			{ majorCategory: "交際費", minorCategory: "旅行" },
			{ majorCategory: "趣味・娯楽", minorCategory: "旅行" },
		],
	},
	{
		name: "プレゼント費",
		monthlyAmount: 4167,
		cycleType: "irregular_variable",
		sortOrder: 401,
		mappings: [{ majorCategory: "交際費", minorCategory: "プレゼント代" }],
	},
	{
		name: "ふるさと納税",
		monthlyAmount: 417,
		cycleType: "irregular_variable",
		sortOrder: 402,
		mappings: [{ majorCategory: "税・社会保障", minorCategory: "ふるさと納税" }],
	},
	{
		name: "家具・家電",
		monthlyAmount: 10000,
		cycleType: "irregular_variable",
		sortOrder: 403,
		mappings: [{ majorCategory: "特別な支出", minorCategory: "家具・家電" }],
	},
	{
		name: "車検代（2台年割）",
		monthlyAmount: 7000,
		cycleType: "irregular_variable",
		sortOrder: 404,
		mappings: [{ majorCategory: "自動車", minorCategory: "車検・整備" }],
	},
	{
		name: "整備費",
		monthlyAmount: 833,
		cycleType: "irregular_variable",
		sortOrder: 405,
		mappings: [],
	},
	{
		name: "タイヤ代（2台年割）",
		monthlyAmount: 2167,
		cycleType: "irregular_variable",
		sortOrder: 406,
		mappings: [],
	},
]
