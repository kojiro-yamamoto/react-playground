# Step 1: 画面を作る（静的 UI）

> Step 0 で掴んだコンポーネントと JSX を実際のコードにする回。
> **まだボタンは動かない。**ゴールは「データ → 画面」の一方向を完成させること。
>
> 対象コード: `src/App.tsx` / `src/App.css` / `src/index.css`

---

## 1-1. 作ったもの

タスク管理アプリの見た目一式。ただし**データはコードに直接書いた仮のもの**で、
チェックも追加も削除もできない。

なぜ動かないものを先に作るのか。理由は Step 0 の `UI = f(状態)` にある。
React では `f`（状態から画面を作る部分）と、状態の変化を切り離して考えられる。
先に `f` を固めておけば、Step 2 では**状態を差し込むだけ**で済む。

```
App                              ← 全体の組み立て役
├── <header>                     ← タイトル、残り件数
├── <form>                       ← 入力欄と追加ボタン（Step 2 で動かす）
└── TaskList   tasks={tasks}     ← 配列を受け取って一覧にする
    ├── TaskItem   task={t1}     ← 1件分の見た目
    ├── TaskItem   task={t2}
    └── TaskItem   task={t3}
```

`TaskItem` は **1つ書いて、タスクの数だけ使い回している**。
タスクが 100 件に増えても、書くコードは 1つのまま。これがコンポーネントの威力。

---

## 1-2. 型を先に決める

```ts
type Task = {
  id: string
  title: string
  done: boolean
}
```

React では**「アプリが扱うデータの形」を最初に決めると、あとが全部楽になる**。

注目すべきは `id`。「配列の何番目か」で十分では、と思うかもしれないが、
並び替え・絞り込み・削除をすると「何番目か」は簡単に変わる。
**中身が動いても変わらない目印**が要る。これが後の `key`（1-4）と、
Step 2 の更新・削除処理で効いてくる。

---

## 1-3. props — 親から子へデータを渡す

`TaskItem` は単体では何も表示できない。「どのタスクを描くのか」を親から教わる必要がある。
その受け渡しが **props**（properties）。

```tsx
// 渡す側（親）— HTML の属性と同じ書き方
<TaskItem task={task} />

// 受け取る側（子）— props は1つのオブジェクトにまとまって第1引数に届く
type TaskItemProps = {
  task: Task
}

function TaskItem({ task }: TaskItemProps) {   // 分割代入で取り出すのが定石
  return <span>{task.title}</span>
}
```

props の型名は `コンポーネント名 + Props` が慣例。
これがあると、`task` を渡し忘れた時点で赤線が出る。
props の渡し忘れ・渡し間違いは React で最も多いミスなので、型の効果が大きい。

### props は読み取り専用

**子は props を書き換えてはいけない。**

```tsx
function TaskItem({ task }: TaskItemProps) {
  task.done = true      // ✗ 絶対にやらない
```

理由は `UI = f(状態)` に戻る。React は「状態が変わったら画面を作り直す」仕組みだが、
子が勝手にデータを書き換えても **React はそれに気づけない**。
画面は変わらないのにデータだけ変わった状態になり、追跡不能なバグになる。

データを変えたくなったら、**変更を親に依頼する**。その方法が Step 2 のテーマ。

### データは上から下へ流れる（一方向データフロー）

```
        tasks（データの持ち主）
   App ─────────────────▶ TaskList ─────────────▶ TaskItem
        props で渡す              props で渡す

   ◀────────────── 逆流はしない ──────────────
```

一見不便だが、これのおかげで**「表示がおかしい ＝ 上流のデータを見に行けばいい」**と、
バグの追跡が一直線になる。React が大規模開発で強いのはこの制約のおかげ。

---

## 1-4. `key` — React が一番よく警告してくるやつ

```tsx
<ul className="task-list">
  {tasks.map((task) => (
    <TaskItem key={task.id} task={task} />
  ))}
</ul>
```

`map` で「タスクの配列 → JSX の配列」に変換している。
**JSX の配列を `{ }` に置くと、React は中身を順番に並べて描画する。**

問題は `key`。付け忘れると必ずこう警告される。

> Warning: Each child in a list should have a unique "key" prop.

### なぜ必要か

Step 0 の仮想 DOM の話とつながる。React は再描画のたびに
「前回のリスト」と「今回のリスト」を見比べて差分だけを反映する。
そのとき **どれとどれが同じ項目なのかを判定する目印**が `key`。

`key` がないと、React は位置（何番目か）で対応付けるしかない。

```
key なし（位置で対応）              key あり（id で対応）
before: [A, B, C]                  before: [A(a1), B(b1), C(c1)]
after : [X, A, B, C]               after : [X(x1), A(a1), B(b1), C(c1)]
         ↑ 全部ズレたと判定                  ↑ X が増えただけ、と正しく判定
```

先頭に1件追加されただけで全項目が作り直され、**入力中の文字やチェック状態が隣の行にズレる**
といった分かりにくいバグが起きる。

| `key` に使うもの | 評価 |
|---|---|
| `task.id` のような**データ固有の ID** | ○ 正解。このリポジトリもこれ |
| 配列の `index` | △ 並び替え・追加・削除をしないリストなら可 |
| `Math.random()` | ✗ 毎回変わるので、毎回全作り直しになる |

`index` が危ないのは、削除や並び替えで**同じ番号が別の項目を指してしまう**から。
これが 1-2 で `id` を最初から持たせた理由。

なお `key` は React が内部管理に使う特別な属性で、**子からは受け取れない**
（`function TaskItem({ key })` は `undefined` になる）。

---

## 1-5. 条件によって表示を変える

JSX に `if` 文は書けないので、分岐には型が決まったやり方がある。

**① 早期リターン** — 表示ごと切り替えるとき。`return` する前は普通の JavaScript なので `if` が使える。

```tsx
function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">タスクはまだありません</p>
  }
  return <ul className="task-list">…</ul>
}
```

**② 三項演算子** — 一部だけ変えるとき。

```tsx
<li className={task.done ? 'task task--done' : 'task'}>
```

**③ `&&`** — 出すか出さないかだけのとき（今回は未使用だが頻出）。

```tsx
{isLoading && <Spinner />}
```

これには**有名な落とし穴**がある。

```tsx
{tasks.length && <p>タスクがあります</p>}
```

`tasks.length` が `0` のとき `0 && ...` は `0` を返し、
**React は `0` を数字として画面に描いてしまう**（`false` や `null` は描かない）。
数値を条件にするときは `tasks.length > 0 && ...` と、必ず真偽値にしてから使う。

---

## 1-6. CSS の当て方

```tsx
import './App.css'      // 変数に入れない import ＝ 読み込む副作用だけが目的
```

Vite がこれを見つけて CSS をバンドルし、ページに差し込む。

### CSS にスコープはない

**重要な注意点。** `App.css` に書いたスタイルは `App.tsx` だけに効くのではなく、
**ページ全体に効く**。ファイルを分けても CSS の世界は 1つで、クラス名は衝突する。

対策としてこのリポジトリでは **BEM 風の命名**を使っている。

```
.task              ← block   （部品そのもの）
.task__title       ← element （部品の中の要素）
.task--done        ← modifier（状態による見た目違い）
```

`.title` のような一般的すぎる名前を避け、部品名を前置きして衝突を防ぐ素朴なルール。

> 実務ではこれを仕組みで解決する **CSS Modules**（`App.module.css`）や
> **Tailwind CSS**、**CSS-in-JS** が使われることが多い。
> ただし最初は素の CSS のほうが仕組みが見えるので、この学習では使っていない。

### 色は CSS 変数にまとめる

```css
:root { --surface: #ffffff; --text: #1a1d21; }

.task { background-color: var(--surface); }

@media (prefers-color-scheme: dark) {
  :root { --surface: #1e2127; --text: #e8ebef; }   /* 変数だけ上書き */
}
```

個々のスタイルは一切書き換えずに、OS の設定に応じてダークテーマになる。

---

## 1-7. `readOnly` が付いている理由

```tsx
<input type="checkbox" checked={task.done} readOnly />
```

React で `checked`（や `value`）を指定したのに `onChange` を書かないと、こう警告される。

> You provided a `checked` prop to a form field without an `onChange` handler.

React は「値を props で固定するなら、変更を受け取る手段もセットで用意しろ」という思想を持つ。
この形を **制御コンポーネント**と呼び、Step 2 の中心テーマになる。
今は変更の仕組みがないので、`readOnly` で「読み取り専用だから意図的です」と明示している。
**Step 2 で `onChange` を付けたら、この `readOnly` は外す。**

---

## 1-8. 今のコードの限界

意図的に残している未完成の部分。すべて Step 2 で解決する。

| 挙動 | 原因 |
|---|---|
| チェックを押しても変わらない | `tasks` がただの定数。書き換えても React は気づかない。しかも今は `readOnly` |
| 「追加」を押すと**ページがリロードされる** | `<form>` の送信を止めていないため、ブラウザ本来の動作が起きる |
| 削除ボタンは無反応 | `onClick` を書いていない |

2つめは React ではなく **HTML 本来の挙動**。Step 2 では `onSubmit` の中で
`event.preventDefault()` を呼び、この既定動作を止めたうえで自前の処理を走らせる。

**React に「データが変わった」と伝える正式な手段が `useState`。** それが次の Step。

---

## 1-9. まとめ

- **props** で親から子へデータを渡す。子から見て**読み取り専用**で、データは常に上から下へ流れる
- props の型は `コンポーネント名 + Props`、受け取りは分割代入 `({ task })` が定石
- 一覧は **`map`** で「データの配列 → JSX の配列」に変換する
- **`key`** は React が差分を正しく判定するための目印。`index` ではなくデータ固有の `id` を使う
- 条件分岐は **早期 `return`**（表示ごと）と **三項演算子**（一部）。`&&` は `0` が描画される落とし穴に注意
- CSS に**スコープはない**。BEM 風の命名で衝突を防ぐ。色は CSS 変数にまとめるとダークモードが楽

| 用語 | 意味 |
|---|---|
| **props** | 親から子へ渡すデータ。子からは読み取り専用 |
| **一方向データフロー** | データが親から子へしか流れない React の原則 |
| **key** | リストの各要素を識別する特別な属性。props としては受け取れない |
| **制御コンポーネント** | 値を React の状態で管理する入力欄。Step 2 で扱う |
| **BEM** | `block__element--modifier` という CSS のクラス命名規則 |

---

← 前は [Step 0: React の全体像とプロジェクト構成](./00-overview.md)
→ 次は **Step 2: 状態を持たせて動かす**（`useState`、イベント、イミュータブル更新）
