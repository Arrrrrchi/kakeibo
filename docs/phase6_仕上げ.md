# Phase 6: 仕上げ

## 概要

エラーハンドリング、ローディング状態、レスポンシブ対応、コード品質の最終チェックを行い、プロダクション品質に仕上げる。

## タスク一覧

### 6-1. エラーハンドリング

#### グローバルエラーバウンダリ

- `src/app/error.tsx` を作成
  - `"use client"` コンポーネント
  - `error` と `reset` props を受け取る
  - ユーザーにわかりやすいエラーメッセージを表示
  - 「再試行」ボタンで `reset()` を呼び出す
  - エラー詳細は開発環境のみ表示

```typescript
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-gray-500">{error.message}</p>
      <button onClick={reset} className="...">
        再試行
      </button>
    </div>
  )
}
```

#### ダッシュボードエラーバウンダリ

- `src/app/dashboard/error.tsx` を作成
  - ダッシュボード固有のエラーメッセージ
  - DB 接続エラー時: 「データベースに接続できません。環境変数を確認してください」
  - データなし時: 「取引データがありません。CSV ファイルをインポートしてください」

#### サーバーアクションのエラーハンドリング

- 各サーバーアクションで `try-catch` を実装
- 統一的なレスポンス型を使用:
  ```typescript
  type ActionResult<T = void> = {
    success: boolean
    data?: T
    error?: string
  }
  ```
- CSV パースエラー: 「CSV ファイルの形式が正しくありません」
- DB エラー: 「データの保存に失敗しました」
- バリデーションエラー: 具体的なフィールドと理由を表示

#### クライアント側のエラー表示

- サーバーアクションの結果に応じてトースト通知を表示
- 成功: 緑の通知バー（3 秒で自動消去）
- エラー: 赤の通知バー（手動で閉じるまで表示）
- 実装方法: 簡易的なトースト状態管理を React Context で実装（外部ライブラリは不使用）

### 6-2. ローディング状態

#### ページレベル

- `src/app/dashboard/loading.tsx`（Phase 4 で作成済み）
- スケルトン UI は Phase 4 で `KpiSkeleton` / `ChartSkeleton` コンポーネントとして実装済み:
  - ヘッダー + CSVアップロードエリア
  - タブバー
  - KPI カード × 4: `animate-pulse` 付きパルスアニメーション
  - チャートエリア × 2: `animate-pulse` 付きパルスアニメーション
- Phase 6 では必要に応じて追加の調整を行う

#### コンポーネントレベル

- CSV アップロード中: ボタンを disabled + スピナー + 「インポート中...」
- マッピング更新中: チップをグレーアウト + スピナーオーバーレイ
- 予算保存中: フォームのボタンを disabled + スピナー
- 予算削除中: 削除ボタンを disabled + スピナー
- モーダルデータ取得中: モーダル内にスピナー

#### 実装パターン

```typescript
// useTransition を使ったパターン
const [isPending, startTransition] = useTransition()

function handleSubmit() {
  startTransition(async () => {
    const result = await serverAction(data)
    if (!result.success) {
      showError(result.error)
    }
  })
}

// UI 側
<Button disabled={isPending}>
  {isPending ? "保存中..." : "保存"}
</Button>
```

### 6-3. レスポンシブ対応

#### ブレークポイント設計

| ブレークポイント | 画面幅 | 対応 |
|---|---|---|
| モバイル | 〜640px | 1 カラム、テーブル横スクロール |
| タブレット | 641〜1024px | 2 カラム |
| デスクトップ | 1025px〜 | フルレイアウト |

#### 各コンポーネントの対応

**KPI カード行**
- デスクトップ: 4 カラムグリッド
- タブレット: 2 カラムグリッド
- モバイル: 1 カラム
- `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`

**チャートセクション**
- デスクトップ: 2 カラム（左: トレンド、右: ドーナツ）
- モバイル: 1 カラム（縦積み）
- `grid-template-columns: 1fr 1fr` → `@media(max-width:960px) { grid-template-columns: 1fr }`

**予算対比テーブル**
- 横スクロール対応: `overflow-x-auto` コンテナ
- 費目名列を固定: `position: sticky; left: 0`
- 月列の最小幅を確保: `min-width: 70px`

**予算マッピングパネル**
- デスクトップ: 未割当セクション（sticky top） + スクロール領域
- モバイル: 未割当セクションの sticky を解除

**モーダル**
- デスクトップ: `max-width: 720px`（取引詳細） / `max-width: 440px`（予算フォーム）
- モバイル: `width: 95vw`, `max-height: 90vh`

**タブバー**
- モバイル: タブテキストを短縮表示（「サマリー」「マッピング」「レポート」）
- `overflow-x-auto` で横スクロール可能に

### 6-4. アクセシビリティ

- モーダルのフォーカストラップ: モーダル内でタブキーが循環
- ESC キーでモーダルを閉じる
- フォーム要素に `label` を紐づけ（`htmlFor` / `id`）
- ボタンに適切な `aria-label`
- チャートに `aria-label` で概要テキスト

### 6-5. TypeScript strict モード最終チェック

- `pnpm build` を実行し、型エラーがないことを確認
- 特に注意すべきポイント:
  - サーバーアクションの戻り値型
  - Prisma 生成型と自前型の整合性
  - `null` / `undefined` の取り扱い
  - イベントハンドラの型（`React.MouseEvent` 等）
- `any` 型の使用を排除

### 6-6. Biome lint / format

- `pnpm lint` で全ファイルをチェック
  ```bash
  pnpm exec biome check .
  ```
- 自動修正可能なものは修正
  ```bash
  pnpm exec biome check --fix .
  ```
- 修正が必要な主な項目:
  - import 順序の整理
  - 未使用変数の削除
  - セミコロン（設定に応じて）
  - インデントスタイルの統一

### 6-7. 最終動作確認チェックリスト

#### CSV インポートフロー

- [ ] ファイル選択 → アップロード → 成功通知
- [ ] 同一ファイルの再インポートで重複が発生しない
- [ ] 不正な CSV でエラーメッセージが表示される
- [ ] インポート後にサマリーが更新される

#### 予算マッピングフロー

- [ ] カテゴリチップの選択/解除が DB に反映される
- [ ] 未割当セクションが正しく更新される
- [ ] 予算項目の追加/編集/削除が動作する
- [ ] マッピング変更後にレポートが更新される

#### 予算対比レポート

- [ ] 月別実績が正しく計算されている
- [ ] 予算との差額・達成率が正しい
- [ ] 超過項目が赤色でハイライトされる
- [ ] 予算外支出が表示される

#### UI/UX

- [ ] タブ切り替えがスムーズ
- [ ] モーダルの開閉が正しく動作する
- [ ] ローディング状態が適切に表示される
- [ ] エラー時にユーザーにわかりやすいメッセージが表示される
- [ ] モバイル/タブレット/デスクトップで適切にレイアウトされる

## 完了条件

- [ ] `pnpm build` が TypeScript エラーなしで成功する
- [ ] `pnpm lint`（Biome）がエラーなしで通過する
- [ ] 全ページでエラーバウンダリが機能する
- [ ] 全非同期操作にローディング状態がある
- [ ] モバイル（375px 幅）でレイアウトが崩れない
- [ ] 最終動作確認チェックリストの全項目が通過する

## 成果物

| ファイル | 説明 |
|---|---|
| `src/app/error.tsx` | グローバルエラーバウンダリ |
| `src/app/dashboard/error.tsx` | ダッシュボードエラーバウンダリ |
| `src/app/dashboard/loading.tsx` | ローディングスケルトン（改修） |
| 各コンポーネント | ローディング状態・エラー表示の追加 |
| 各コンポーネント | レスポンシブ対応の CSS 追加 |
