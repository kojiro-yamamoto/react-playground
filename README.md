# react-playground

React の学習用リポジトリ。**タスク管理アプリ**を少しずつ作りながら React の基礎を学びます。

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

| # | ステップ | 学ぶこと | ノート | 状態 |
|---|---------|---------|--------|------|
| 0 | React の全体像とプロジェクト構成 | React の思想、JSX、コンポーネント、Vite、TypeScript | [00-overview.md](./documents/00-overview.md) | ✅ |
| 1 | 画面を作る（静的 UI） | コンポーネント分割、props、配列の map と key、型定義、CSS | [01-components-props.md](./documents/01-components-props.md) | ✅ |
| 2 | 状態を持たせて動かす | useState、イベント、イミュータブル更新、フォーム、state の持ち上げ | – | ⬜ |
| 3 | 絞り込みと永続化 | 派生した値、useEffect、localStorage | – | ⬜ |
| 4 | 整理する | ファイル分割、カスタムフック、コンポーネント設計 | – | ⬜ |

各 Step は「実装する → 学んだ内容を `documents/NN-*.md` に書き残す」の流れで進めます。
