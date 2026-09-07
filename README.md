# react-playground

React の学習用リポジトリ。**タスク管理アプリ**を作りながら React の基礎を学びました。

学習ノートは [`documents/`](./documents) に Step ごとの Markdown として残しています。
**`documents/00-overview.md` から順に読めば、React の全体像を追える**構成です。

## 技術構成

- React 19 + TypeScript
- Vite（開発サーバー / ビルドツール）

## 起動方法

```bash
npm install   # 初回のみ
npm run dev   # 開発サーバー起動 → http://localhost:5173
```

## 学習ロードマップ

| # | ステップ | 学ぶこと | ノート |
|---|---------|---------|--------|
| 0 | React の全体像とプロジェクト構成 | React の思想、JSX、コンポーネント、Vite、TypeScript | [00-overview.md](./documents/00-overview.md) |
| 1 | 画面を作る（静的 UI） | コンポーネント分割、props、配列の map と key、型定義、CSS | [01-components-props.md](./documents/01-components-props.md) |
| 2 | 状態を持たせて動かす | useState、イベント、イミュータブル更新、フォーム、state の持ち上げ | [02-state.md](./documents/02-state.md) |
| 3 | 絞り込みと永続化 | 派生した値、useEffect、localStorage | [03-effect-storage.md](./documents/03-effect-storage.md) |
| 4 | 整理する | ファイル分割、カスタムフック、コンポーネント設計 | [04-refactoring.md](./documents/04-refactoring.md) |

各 Step の完了時点は `step0`〜`step4` ブランチとしてリモートに残してあります。
その Step の画面を動かしたいときは、ブランチを切り替えて `npm run dev` すれば見られます。

```bash
git switch step2   # Step 2 完了時点の状態
npm run dev
```

`main` は常に最新（Step 4 まで完了した状態）です。

## アプリの機能

- タスクの追加 / 完了トグル / 削除
- すべて / 未完了 / 完了 の絞り込み
- localStorage への自動保存（リロードしても消えない）
- OS のダークモードに自動追従

## ディレクトリ構成

```
src/
├── main.tsx              起動地点
├── App.tsx               画面の組み立て
├── types.ts              アプリ共通の型（Task / Filter）
├── lib/storage.ts        localStorage の入出力（React 非依存）
├── hooks/useTasks.ts     タスクの state・更新・永続化
└── components/           画面の部品（.tsx と .css をセットで配置）
    ├── Header
    ├── TaskForm
    ├── FilterBar
    ├── TaskList
    └── TaskItem
```
