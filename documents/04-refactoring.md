# Step 4: 整理する

> Step 3 でアプリは完成した。最後は **250行に膨れた `App.tsx` を分解する**回。
> 新しい機能は増えないが、**React で「どこに何を置くか」**という設計の話をする。
>
> 対象コード: `src/` 以下すべて

---

## 4-1. 何をしたか

1ファイルだったものを、**役割ごとに 10ファイル**へ分けた。

```
src/
├── main.tsx                    起動地点
├── App.tsx              48行   画面の組み立てだけ
├── App.css                     全体レイアウトだけ
├── index.css                   CSS 変数・リセット
├── types.ts              9行   Task / Filter（アプリ共通の型）
├── lib/
│   └── storage.ts       29行   localStorage の入出力
├── hooks/
│   └── useTasks.ts      34行   タスクの state・更新・永続化
└── components/
    ├── Header.tsx       17行   ＋ Header.css
    ├── TaskForm.tsx     35行   ＋ TaskForm.css
    ├── FilterBar.tsx    39行   ＋ FilterBar.css
    ├── TaskList.tsx     34行   ＋ TaskList.css
    └── TaskItem.tsx     30行   ＋ TaskItem.css
```

**すべてのファイルが 50行以下**になった。合計行数はむしろ増えているが、
「タスクの保存方法を変えたい」と思ったとき見るべきファイルが `storage.ts` だけに絞られる。
これが分割の目的で、**行数を減らすことではない**。

---

## 4-2. どこに何を置くか

このリポジトリの分け方は React でよくある構成。

| 場所 | 置くもの | 判断基準 |
|---|---|---|
| `components/` | 画面に出る部品 | JSX を返すか |
| `hooks/` | 状態を持つロジック | `use〜` を呼んでいるか |
| `lib/` | React と無関係な処理 | React を import せずに書けるか |
| `types.ts` | 複数箇所で使う型 | 2ファイル以上から参照されるか |

**`lib/storage.ts` が React を一切 import していない**のがポイント。
localStorage への読み書きは React の都合と関係のない仕事なので、切り離しておくと、
テストも書きやすいし、あとで保存先をサーバーに変えるときもここだけ差し替えれば済む。

> **規模による使い分け**
> 今回のような**種類ごと**の分け方（`components/` `hooks/`）は小〜中規模向け。
> 大きくなると `features/tasks/` `features/auth/` のように**機能ごと**に切るほうが管理しやすい。
> 最初から後者にする必要はなく、辛くなってから移ればよい。

### 型はどこに書くか

- **そのファイルでしか使わない型** → そのファイルに書く（`TaskItemProps` など）
- **複数から使う型** → `types.ts` に置く（`Task` / `Filter`）

props の型を全部 `types.ts` に集めたくなるが、**やらないほうがいい**。
`TaskItemProps` は `TaskItem.tsx` の一部であって、離すと読むとき往復させられる。

---

## 4-3. カスタムフック — この Step の主役

```ts
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function addTask(title: string) { ... }
  function toggleTask(id: string) { ... }
  function deleteTask(id: string) { ... }

  return { tasks, addTask, toggleTask, deleteTask }
}
```

使う側はこうなる。

```tsx
const { tasks, addTask, toggleTask, deleteTask } = useTasks()
```

**`App` は「タスクがどこに保存されているか」を知らなくなった。**
localStorage をやめてサーバー通信に変えても、`App.tsx` は 1文字も変わらない。

### カスタムフックとは何か

**`use` で始まる、中で他のフックを呼ぶ関数。** それだけ。特別な登録も継承も要らない。

「コンポーネントの中にしか書けないはずの `useState` を、なぜ普通の関数に移せるのか」
と思うかもしれない。答えは、**フックは呼び出したコンポーネントに紐づく**から。
`useTasks()` を `App` の中で呼べば、その `useState` は `App` の state になる。
関数はただの整理箱で、state の持ち主は変わっていない。

### 呼ぶたびに別の state になる

よくある誤解。**カスタムフックは state を共有しない。**

```tsx
function A() { const { tasks } = useTasks() }   // A 専用の tasks
function B() { const { tasks } = useTasks() }   // B 専用の tasks（別物）
```

共有されるのは**ロジックだけ**で、state は呼び出しごとに独立して作られる。
複数のコンポーネントで同じデータを共有したいなら、Step 2 で学んだ
**state の持ち上げ**をするか、**Context** という別の仕組みを使う。

### `use` で始めるのは必須ルール

React は名前の `use` を見て「これはフックだ」と判断する。
`getTasks` のような名前にすると、Lint がフックのルール違反を検出できなくなる。

### フックのルール2つ

```tsx
// ✗ 条件の中で呼ぶ
if (isReady) {
  const [x, setX] = useState(0)
}

// ✗ ループの中で呼ぶ
for (const t of tasks) {
  useState(t)
}
```

1. **フックは関数のトップレベルでだけ呼ぶ**（条件分岐・ループ・入れ子関数の中はダメ）
2. **React のコンポーネントかカスタムフックの中でだけ呼ぶ**

理由は React の内部実装にある。React は state を名前ではなく
**「何番目に呼ばれたか」で管理している**。

```
1回目のレンダリング          2回目（isReady が false）
① useState(tasks)     →     ① useState(tasks)
② useState(filter)    →     ②（呼ばれない）        ← 順番が狂う
③ useEffect(...)      →     ② useEffect(...)       ← ②の state を掴んでしまう
```

呼ぶ順番が毎回同じであることが大前提。だから条件分岐の中に置けない。

### 戻り値はオブジェクトにする

```ts
return { tasks, addTask, toggleTask, deleteTask }   // ○ オブジェクト
return [tasks, addTask, toggleTask, deleteTask]     // △ 配列
```

`useState` が配列を返すのは、**2つしかなく、好きな名前を付けたいから**
（`[tasks, setTasks]` `[filter, setFilter]`）。
一方カスタムフックは戻り値が増えがちなので、**順番を覚えなくていいオブジェクト**が向く。
必要なものだけ取り出せる利点もある。

```tsx
const { tasks } = useTasks()   // 表示だけしたいなら、これで足りる
```

---

## 4-4. 何を切り出さ「なかった」か

分割の話で大事なのは、**やりすぎないこと**。今回あえて残したものが 3つある。

### ① `filter` state は `App` に残した

`useTasks` に入れなかった。理由は**性質が違う**から。

| | 性質 |
|---|---|
| `tasks` | アプリの**データ**。保存され、他の画面でも使いうる |
| `filter` | **今この画面をどう見ているか**。保存不要で、この画面限りの関心事 |

混ぜると `useTasks` が「データ管理」と「画面の見せ方」の両方を持ってしまう。

### ② `visibleTasks` の計算は `App` に残した

5行の `filter` を切り出しても、**読みに行く手間が増えるだけ**。
「その場で読めば分かるコード」は、その場に置いておくほうが読みやすい。

### ③ `EMPTY_MESSAGES` は `App` に、`FILTERS` は `FilterBar` に

どちらも定数だが、**使う人の近くに置く**という基準で分けた。
`FILTERS` は `FilterBar` しか使わないので `FilterBar.tsx` の中にある。

> **分割の判断基準**
> 「ファイルが長いから」ではなく、**「変更する理由が違うから」**分ける。
> 保存方法を変えたい人と、ボタンの見た目を変えたい人は別人。だから別ファイル。

---

## 4-5. import と export の書き方

### `import type`

```ts
import type { Task } from '../types'          // 型だけを import
import { useState, type FormEvent } from 'react'   // 値と型を混ぜる場合
```

このプロジェクトは `tsconfig` で **`verbatimModuleSyntax: true`** が有効なので、
型を import するときは `type` を付けるのが**必須**。

理由は、型はビルド時に消えるから。`type` を付けておくと、
ビルドツールは中身を見ずに「この import は消していい」と判断できる。

### 名前付き export に統一した

```ts
export function TaskItem() { ... }        // 名前付き export
import { TaskItem } from './TaskItem'

export default function TaskItem() { ... }  // デフォルト export
import Anything from './TaskItem'           // 好きな名前で import できてしまう
```

このリポジトリでは**名前付きに統一**した。理由は、

- 名前がファイル間で一致するので、検索・一括リネームが効く
- `import Anything` のような取り違えが起きない
- エディタの自動 import が正確に効く

デフォルト export も広く使われている（Vite の初期テンプレートは `export default App`）。
**プロジェクト内で統一されていることのほうが重要**なので、どちらでもよい。

---

## 4-6. CSS も部品ごとに置いた

```
components/TaskItem.tsx  ─┐
components/TaskItem.css  ─┘  セットで置く
```

`TaskItem.tsx` の中で `import './TaskItem.css'` している。
**その部品を消すとき、CSS も一緒に消せる**のが利点。1ファイルに全部書いていると、
どのスタイルがもう使われていないか誰にも分からなくなる。

ただし **Step 1 で学んだとおり、CSS にスコープはないまま**。
ファイルを分けても全部ページ全体に効く。衝突を防いでいるのは
`.task__title` のような **BEM 風の命名**であって、ファイル分割ではない。

`index.css` にだけ CSS 変数（`--accent` など）を置き、
各コンポーネントの CSS は `var(--accent)` を参照している。**色の定義は1か所**。

---

## 4-7. コンポーネント設計の指針

ここまでで自然に守っていたことを、原則として言語化しておく。

**① 1つのコンポーネントは1つのことをする**
`TaskItem` は1件の表示、`TaskForm` は入力、`FilterBar` は絞り込み。
「このコンポーネントは何をするもの？」に「〜と〜」で答えたくなったら、分割の合図。

**② データは props で受け取り、結果は関数で返す**
子は自分で state を持たず、`on〜` で親に報告する（Step 2）。
例外は `TaskForm` の `title`。**その部品の中で完結する state は持ってよい。**

**③ 見た目の部品は「外の世界」を知らない**
`TaskItem` は localStorage も `useTasks` も知らない。`task` と 2つの関数を受け取るだけ。
だから他のどんなアプリにも貼り付けられるし、テストも簡単。

```
      知っている ←──────────────────→ 知らない
  useTasks    App    TaskList    TaskItem
  (保存)   (組み立て)  (並べる)   (1件描く)
```

上に行くほど「アプリ固有の事情」を持ち、下に行くほど「純粋な部品」になる。
**この階層を意識すると、どこに何を書くか迷わなくなる。**

---

## 4-8. ここから先

4 Step で React の中核は一通り触った。次に進むなら、この順がおすすめ。

| テーマ | 内容 |
|---|---|
| **公式ドキュメント** | [ja.react.dev の「学ぶ」](https://ja.react.dev/learn) を通しで読む。ここまでの知識があれば読める |
| **`useContext`** | props のバケツリレー（Step 2-7）を解消する仕組み |
| **`useRef` / `useMemo`** | DOM への直接アクセスと、重い計算のキャッシュ |
| **ルーティング** | [React Router](https://reactrouter.com/) で複数ページのアプリにする |
| **サーバー通信** | `fetch` + [TanStack Query](https://tanstack.com/query)。`useEffect` で自前実装しないのが今の主流 |
| **実行時の型検証** | [Zod](https://zod.dev/)。Step 3-5 の `as Task[]` 問題を解決する |
| **テスト** | Vitest + React Testing Library |
| **フレームワーク** | [Next.js](https://nextjs.org/)。ルーティング・サーバー処理まで込みの本番構成 |

このアプリを育てるなら、**期限の追加**（`Task` に `dueDate` を足す）、
**編集機能**、**並び替え**あたりが、ここまでの知識だけで実装できて練習になる。

---

## 4-9. まとめ

- 分割の目的は行数を減らすことではなく、**「変更したいとき見る場所を1か所にする」**こと
- **「変更する理由が違うもの」を別ファイルにする**。長いから分けるのではない
- `lib/` には **React を import しない処理**を置く。差し替えやテストが楽になる
- **カスタムフック**＝ `use` で始まり、中で他のフックを呼ぶ関数
  - state の持ち主は呼び出したコンポーネント。**呼ぶたびに別の state ができる**（共有されない）
  - フックは**トップレベルでのみ**呼ぶ。React は呼ばれた**順番**で state を管理しているから
  - 戻り値は順番を覚えなくていい**オブジェクト**が向く
- **切り出しすぎない**。その場で読めば分かるものは、その場に置く
- 型は `import type`。export はプロジェクト内で統一する（ここでは名前付き）
- CSS は部品と一緒に置くが、**スコープがないことは変わらない**。守っているのは命名規則

| 用語 | 意味 |
|---|---|
| **カスタムフック** | `use` で始まる、フックを内部で呼ぶ関数。ロジックの再利用単位 |
| **フックのルール** | トップレベルでのみ・React 関数の中でのみ呼ぶ |
| **名前付き export** | `export function X` 。import 側で名前が固定される |
| **Context** | props を経由せずにデータを配る仕組み（未学習） |

---

## 全 Step の振り返り

| Step | 得たもの |
|---|---|
| **0** | React は `UI = f(状態)`。画面の更新は人間ではなくライブラリの仕事 |
| **1** | 画面は**コンポーネント**という部品の組み合わせ。データは **props で上から下へ**流れる |
| **2** | 変化するデータは **state**。**イミュータブルに更新**し、更新処理は state の持ち主に集める |
| **3** | **計算できるものは state にしない**。外の世界と繋ぐときだけ **`useEffect`** |
| **4** | **変更する理由が違うもの**を分ける。ロジックは**カスタムフック**にまとめられる |

すべては Step 0 の一行に戻る。

```
UI = f(状態)
```

- **状態** を決めるのが Step 2・3（何を state にし、何を state にしないか）
- **f** を組み立てるのが Step 1・4（コンポーネントをどう分けるか）

React でつまずいたときは、**「今、状態は何か。それはどこにあるべきか」**に立ち返るとよい。

---

← 前は [Step 3: 絞り込みと永続化](./03-effect-storage.md)
