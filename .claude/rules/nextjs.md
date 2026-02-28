# Next.js 16 Best Practices

## 動作要件

- Node.js 20.9+ (22 推奨)
- React 19.2+
- TypeScript 5+

## Server Components (デフォルト)

- コンポーネントはデフォルトでサーバーコンポーネントとして扱う
- `"use client"` は以下の場合にのみ付与する:
  - `useState`, `useEffect`, `useRef` 等の React hooks を使用する場合
  - ブラウザ API (`window`, `document`, `localStorage`) にアクセスする場合
  - イベントハンドラ (`onClick`, `onChange`) を使用する場合
  - サードパーティライブラリがクライアントサイドを要求する場合 (Recharts 等)
- サーバーコンポーネントではデータ取得を直接行う (`async function` で `await`)

## Async Request APIs (Next.js 16 必須)

- `params`, `searchParams` は非同期アクセスのみ (`await params`)
- `cookies()`, `headers()`, `draftMode()` も非同期
- 同期アクセスは Next.js 16 で完全に削除された
- 型ヘルパー `PageProps`, `LayoutProps` を活用する (`npx next typegen` で生成)

## Data Fetching

- データ取得はサーバーコンポーネントまたは loaders で行い、props 経由でクライアントコンポーネントに渡す
- `useEffect` でのデータ取得は避ける
- Server Actions は副作用 (DB 書き込み) のためだけに使用する
- `revalidatePath()` / `revalidateTag()` はデータ変更後に必ず呼び出す

## Routing

- App Router を使用する (Pages Router は使わない)
- `page.tsx` はデフォルトでサーバーコンポーネント
- `loading.tsx` でストリーミング対応のローディング UI を提供する
- `error.tsx` でエラーバウンダリを設定する (`"use client"` が必要)
- `middleware.ts` は `proxy.ts` にリネーム可能（Node.js ランタイムで動作）

## Bundler

- Turbopack がデフォルトバンドラー (dev / build 両方、`--turbopack` フラグ不要)
- Turbopack 設定は `next.config.ts` の `turbopack` キーで行う (`experimental.turbopack` は廃止)

## Linting

- `next lint` コマンドは廃止された
- Biome を直接使用する (`pnpm lint`)

## Performance

- クライアントコンポーネントは可能な限り末端 (リーフ) に配置する
- 大きなクライアントコンポーネントバンドルは避ける
- `next/dynamic` による動的インポートを必要に応じて使用する
- 画像は `next/image` を使用する
