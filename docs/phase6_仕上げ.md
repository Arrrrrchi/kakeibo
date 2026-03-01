# Phase 6: 仕上げ

## 概要

エラーハンドリング、ローディング状態、レスポンシブ対応、コード品質の最終チェックを行い、プロダクション品質に仕上げる。

## タスク一覧

### 6-1. エラーハンドリング

#### グローバルエラーバウンダリ

- [x] `src/app/error.tsx` を作成
  - `"use client"` コンポーネント
  - `error` と `reset` props を受け取る
  - ユーザーにわかりやすいエラーメッセージを表示
  - 「再試行」ボタンで `reset()` を呼び出す（Button コンポーネントを使用）
  - エラー詳細は `process.env.NODE_ENV === "development"` でのみ表示

#### ダッシュボードエラーバウンダリ

- [x] `src/app/dashboard/error.tsx` を作成
  - ダッシュボード固有のエラーメッセージ
  - DB 接続エラー時: 「データベースに接続できません。環境変数を確認してください。」
  - その他: 「ダッシュボードの読み込みに失敗しました。」

#### サーバーアクションのエラーハンドリング

- [x] 統一的なレスポンス型 `ActionResult<T>` を `src/types/action.ts` に定義
  ```typescript
  export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string }
  ```
- [x] 全 5 アクションに `try-catch` を実装:
  - `import-csv.ts`: CSVパースエラー → 「CSVファイルの形式が正しくありません」
  - `upsert-budget.ts`: DB エラー → 「データの保存に失敗しました」
  - `delete-budget.ts`: DB エラー → 「データの削除に失敗しました」
  - `update-mappings.ts`: DB エラー → 「マッピングの更新に失敗しました」
  - `get-transactions-by-category.ts`: DB エラー → 「取引データの取得に失敗しました」
- [x] バリデーションエラー: 具体的なフィールドと理由を表示（既存のバリデーションを維持）

#### クライアント側のエラー表示

- [x] トースト通知システムを React Context で実装（`src/client/components/ui/Toast.tsx`）
  - `ToastProvider` を `src/app/layout.tsx` でラップ
  - `useToast()` フックで `showToast(message, type)` を取得
  - 成功: 緑の通知バー（3 秒で自動消去）
  - エラー: 赤の通知バー（閉じるボタンで手動消去）
- [x] トースト通知を統合したコンポーネント:
  - `CsvUploadForm`: インポート成功/失敗をトーストで通知
  - `BudgetFormModal`: 予算の追加/更新/削除の成功をトーストで通知
  - `BudgetItemCard`: マッピング更新の失敗をトーストで通知

### 6-2. ローディング状態

#### ページレベル

- [x] `src/app/dashboard/loading.tsx`（Phase 4 で作成済み、Phase 6 でレスポンシブ対応を追加）

#### コンポーネントレベル

- [x] CSV アップロード中: ボタンを disabled + スピナー（`loading` prop）+ 「インポート中...」
- [x] マッピング更新中: カード全体を `opacity-60` でフェード表示（`useTransition` で制御）
- [x] 予算保存中: フォームのボタンを disabled + スピナー（`loading` prop）+ 「保存中...」
- [x] 予算削除中: 削除ボタンを `disabled`
- [x] モーダルデータ取得中: モーダル内に「読み込み中...」テキスト表示

#### 実装パターン

- `Button` コンポーネントに `loading` prop を追加し、SVG スピナーを表示
- `loading` が true の場合は自動的に `disabled` になる

```typescript
<Button type="submit" loading={isPending}>
  {isPending ? "保存中..." : "保存"}
</Button>
```

### 6-3. レスポンシブ対応

#### ブレークポイント設計

Tailwind CSS のデフォルトブレークポイントを使用:

| ブレークポイント | 画面幅 | 対応 |
|---|---|---|
| モバイル | 〜640px | 1 カラム、テーブル横スクロール |
| sm (641px〜) | タブレット | 2 カラム |
| lg (1025px〜) | デスクトップ | フルレイアウト |

#### 各コンポーネントの対応

**ダッシュボードページヘッダー**
- [x] デスクトップ: 横並び（タイトル + CSV アップロード）
- [x] モバイル: 縦積み（`flex-col sm:flex-row`）
- [x] パディング: `p-4 sm:p-6`

**KPI カード行**
- [x] デスクトップ: 4 カラムグリッド（`lg:grid-cols-4`）
- [x] モバイル: 2 カラムグリッド（`grid-cols-2`）

**チャートセクション**
- [x] デスクトップ: 2 カラム（`lg:grid-cols-2`）
- [x] モバイル: 1 カラム（`grid-cols-1`）

**予算対比テーブル**
- [x] 横スクロール対応: `overflow-auto` コンテナ
- [x] 費目名列を固定: `sticky left-0`
- [x] 月列の最小幅を確保: `min-w-[70px]`

**予算マッピングパネル**
- [x] デスクトップ: 未割当セクション（`sm:sticky sm:top-0`）
- [x] モバイル: 未割当セクションの sticky を解除

**モーダル**
- [x] デスクトップ: `max-w-lg`、`max-h-[80vh]`
- [x] モバイル: `w-[95vw]`、`max-h-[90vh]`

**タブバー**
- [x] `overflow-x-auto` + `flex` で横スクロール可能
- [x] `whitespace-nowrap` でテキストの折り返しを防止

**CSV アップロードフォーム**
- [x] デスクトップ: 横並び（`sm:flex-row sm:items-end`）
- [x] モバイル: 縦積み（`flex-col`）

### 6-4. アクセシビリティ

- [x] モーダルのフォーカストラップ: モーダル内で Tab キーが循環
- [x] モーダルオープン時に最初のフォーカス可能要素に自動フォーカス
- [x] モーダル閉じた時に元のフォーカスを復元
- [x] ESC キーでモーダルを閉じる（Phase 4 で実装済み）
- [x] フォーム要素に `label` を紐づけ（`htmlFor` / `id`）（Phase 5 で実装済み）
- [x] モーダル閉じるボタンに `aria-label="閉じる"` を追加
- [x] 編集ボタンに `aria-label="編集"` を追加（Phase 5 で実装済み）
- [x] 折りたたみボタンに `aria-label="折りたたみ"` を追加（Phase 5 で実装済み）
- [x] チャートに `aria-label` + `role="img"` で概要テキストを追加:
  - MonthlyTrendChart: 「月次収支トレンドチャート」
  - CategoryPieChart: 「カテゴリ別支出チャート」
  - StackedBarChart: 「カテゴリ別月次推移チャート」
- [x] タブに `role="tab"` / `aria-selected`（Phase 5 で実装済み）
- [x] モーダルに `role="dialog"` / `aria-modal="true"` / `aria-label`（Phase 4 で実装済み）

### 6-5. TypeScript strict モード最終チェック

- [x] `pnpm build` を実行し、TypeScript エラーなしで成功を確認

### 6-6. Biome lint / format

- [x] `pnpm exec biome check .` で全ファイルをチェック → エラーなし

### 6-7. 最終動作確認チェックリスト

#### CSV インポートフロー

- [ ] ファイル選択 → アップロード → 成功通知（トースト）
- [ ] 同一ファイルの再インポートで重複が発生しない
- [ ] 不正な CSV でエラーメッセージが表示される（トースト）
- [ ] インポート後にサマリーが更新される

#### 予算マッピングフロー

- [ ] カテゴリチップの選択/解除が DB に反映される
- [ ] 未割当セクションが正しく更新される
- [ ] 予算項目の追加/編集/削除が動作する（トースト通知あり）
- [ ] マッピング変更後にレポートが更新される

#### 予算対比レポート

- [ ] 月別実績が正しく計算されている
- [ ] 予算との差額・達成率が正しい
- [ ] 超過項目が赤色でハイライトされる
- [ ] 未割当カテゴリが UnmappedSection に正しく表示される

#### UI/UX

- [ ] タブ切り替えがスムーズ
- [ ] モーダルの開閉が正しく動作する（フォーカストラップ含む）
- [ ] ローディング状態が適切に表示される（スピナー付きボタン）
- [ ] エラー時にトースト通知でわかりやすいメッセージが表示される
- [ ] モバイル/タブレット/デスクトップで適切にレイアウトされる

## 完了条件

- [x] `pnpm build` が TypeScript エラーなしで成功する
- [x] `pnpm lint`（Biome）がエラーなしで通過する
- [x] 全ページでエラーバウンダリが機能する
- [x] 全非同期操作にローディング状態がある
- [x] モバイル（375px 幅）でレイアウトが崩れない設計
- [ ] 最終動作確認チェックリストの全項目が通過する

## 成果物

| ファイル | 説明 |
|---|---|
| `src/types/action.ts` | 統一アクション結果型 `ActionResult<T>` |
| `src/app/error.tsx` | グローバルエラーバウンダリ |
| `src/app/dashboard/error.tsx` | ダッシュボードエラーバウンダリ |
| `src/app/dashboard/loading.tsx` | ローディングスケルトン（レスポンシブ対応） |
| `src/client/components/ui/Toast.tsx` | トースト通知コンポーネント（Context） |
| `src/client/components/ui/Toast.test.tsx` | トースト通知テスト |
| `src/client/components/ui/Button.tsx` | Button に `loading` prop 追加 |
| `src/server/actions/*.ts` | 全アクションに try-catch + ActionResult 型適用 |
| `src/client/components/forms/CsvUploadForm.tsx` | トースト統合 + レスポンシブ対応 |
| `src/client/components/dashboard/BudgetFormModal.tsx` | トースト統合 |
| `src/client/components/dashboard/BudgetItemCard.tsx` | エラー時トースト統合 |
| `src/client/components/dashboard/TransactionDetailModal.tsx` | ActionResult 対応 |
| `src/client/components/dashboard/DashboardTabs.tsx` | タブバーレスポンシブ対応 |
| `src/client/components/dashboard/UnmappedSection.tsx` | モバイルで sticky 解除 |
| `src/client/components/dashboard/ReportPanel.tsx` | 月列最小幅設定 |
| `src/client/components/ui/Modal.tsx` | フォーカストラップ + レスポンシブ対応 |
| `src/client/components/charts/*.tsx` | aria-label 追加 |
| `src/app/dashboard/page.tsx` | レスポンシブ対応 |
| `src/app/layout.tsx` | ToastProvider 追加 |
