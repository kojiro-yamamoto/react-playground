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
| 0 | 全体像とプロジェクト構成 | React の思想、JSX、コンポーネント、Vite | [00-overview.md](./documents/00-overview.md) | ✅ |
| 1 | 画面の骨組みを作る | JSX で UI を組む、CSS の当て方 | – | ⬜ |
| 2 | タスク一覧を表示する | 配列の map、key、props、型定義 | – | ⬜ |
| 3 | 完了/未完了を切り替える | useState、再レンダリング、イミュータブル更新 | – | ⬜ |
| 4 | タスクを追加する | フォーム、制御コンポーネント、イベント | – | ⬜ |
| 5 | タスクを削除する | filter、state の持ち上げ | – | ⬜ |
| 6 | 未完了だけ表示する絞り込み | 派生した値、state を増やしすぎない設計 | – | ⬜ |
| 7 | リロードしても消えないようにする | useEffect、副作用、localStorage | – | ⬜ |
| 8 | ファイルを分割して整理する | コンポーネント設計、型の置き場所 | – | ⬜ |

## 進め方

各 Step では、

1. 実装を行う
2. その Step で学んだ内容を `documents/NN-*.md` に書き残す

という流れで進めます。
