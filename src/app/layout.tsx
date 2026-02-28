import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css"

const notoSansJP = Noto_Sans_JP({
	variable: "--font-noto-sans-jp",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "家計分析ダッシュボード",
	description: "マネーフォワード Me の CSV データをもとに家計の支出を予算と比較・分析するダッシュボード",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ja">
			<body className={`${notoSansJP.variable} font-sans antialiased`}>{children}</body>
		</html>
	)
}
