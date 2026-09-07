# Step 2: 状態を持たせて動かす

> Step 1 で作った「動かない画面」に **state（状態）** を差し込んで、アプリとして動かす回。
> React の中心概念が全部出てくる、いちばん重要な Step。
>
> 対象コード: `src/App.tsx`

---

## 2-1. 何が変わったか

追加・完了トグル・削除がすべて動くようになった。変更点は 4つ。

| 変更 | 内容 |
|---|---|
| `tasks` を `useState` に | ただの定数だったものを「変わりうるデータ」に昇格 |
| `TaskForm` を切り出し | 入力欄の文字も state で管理（制御コンポーネント） |
| 更新処理を `App` に集約 | `handleAdd` / `handleToggle` / `handleDelete` |
| 子に**関数を props で渡す** | 子は「押された」と親に報告するだけ |

構造はこうなった。**データは下へ、イベントは上へ**流れている。

```
                  ┌─────────────────────────────┐
                  │ App                          │
                  │  tasks（state の持ち主）      │
                  │  handleAdd / Toggle / Delete │
                  └──┬────────────────────┬──────┘
        onAdd ↑      │ props              │ props      ↑ onToggle / onDelete
              │      ▼ tasks              ▼ tasks      │
         ┌────┴──────────┐        ┌───────────────┐    │
         │ TaskForm      │        │ TaskList      │────┘
         │  title(state) │        └───────┬───────┘
         └───────────────┘                ▼
                                   ┌─────────────┐
                                   │ TaskItem    │
                                   └─────────────┘
```

---

## 2-2. `useState` — React に「変わるデータ」を教える

```tsx
const [tasks, setTasks] = useState<Task[]>(initialTasks)
//     ↑値    ↑更新する関数        ↑型      ↑初期値
```

`useState` は **[現在の値, それを更新する関数] という2要素の配列を返す**。
それを分割代入で受け取っている。名前は `[x, setX]` が慣例。

型は初期値から推論されるので普段は省略でよい（`useState('')` は `string` になる）。
ただし空配列から始めるときは `never[]` と推論されるため、`useState<Task[]>([])` と明示が必要。

### なぜ普通の変数ではダメなのか

```tsx
function App() {
  let tasks = initialTasks       // ✗ これでは動かない
```

理由が 2つある。どちらも Step 0 の「コンポーネントは関数」という事実から来ている。

**① 書き換えても React が気づかない**
`tasks.push(...)` しても React には何も伝わらないので、再レンダリングが起きない。
データは変わったが画面は古いまま。

**② 再レンダリングのたびに初期化される**
コンポーネントは再レンダリングのたびに**関数がもう一度実行される**。
`let tasks = initialTasks` も毎回実行されるので、値は毎回リセットされる。

`useState` はこの両方を解決する。**値を React 側が保管し**（②の解決）、
**`setTasks` が呼ばれたら再レンダリングを予約する**（①の解決）。

### 再レンダリングの流れ

```
① ユーザーがチェックボックスを押す
② onChange → onToggle(task.id) → App の handleToggle が走る
③ setTasks(...) に「新しい配列」を渡す
④ React が「state が変わった」と判定
⑤ App 関数をもう一度実行 → 新しい tasks で JSX を作る
⑥ 前回の JSX と比較し、変わった箇所だけ実 DOM に反映（Step 0 の仮想 DOM）
```

**画面を書き換えるコードは 1行も書いていない。** ④〜⑥は全部 React の仕事。
これが Step 0 の `UI = f(状態)` が実際に動いている姿。

---

## 2-3. イベントハンドラ

```tsx
<button onClick={() => onDelete(task.id)}>×</button>
<input onChange={(event) => setTitle(event.target.value)} />
<form onSubmit={handleSubmit}>
```

HTML の `onclick` に対し、JSX は **キャメルケースの `onClick`**、値は文字列ではなく**関数そのもの**。

### 一番多いミス：関数を「呼んでしまう」

```tsx
<button onClick={handleDelete}>          {/* ○ 関数を渡している */}
<button onClick={handleDelete()}>        {/* ✗ その場で実行してしまう */}
```

下は**レンダリング中に即座に実行**されてしまう。しかも `setTasks` を呼ぶので
再レンダリング → また実行 → …と無限ループになる。

### 引数を渡したいときはアロー関数で包む

```tsx
<button onClick={() => onDelete(task.id)}>
```

`() => ...` は「押されたときに実行する手順」を包んだ関数。
これを渡しているので、クリックされて初めて `onDelete(task.id)` が走る。

### `event.preventDefault()`

```tsx
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()   // ← これがないとページがリロードされる
```

Step 1 で触れた `<form>` の既定動作（送信してページ遷移）を止めている。
React 固有の話ではなく、素の JavaScript でも同じ。

`<form onSubmit>` を使うと、**ボタンのクリックでも Enter キーでも**同じ処理が走る。
`<button onClick>` だけで済ませると Enter が効かないので、フォームはこの形が定石。

イベントの型は、JSX に直接書いたアロー関数なら TypeScript が推論してくれる。
`handleSubmit` のように独立した関数にする場合だけ、明示的な型注釈が必要
（`import { type FormEvent } from 'react'`）。

---

## 2-4. イミュータブル更新 — 「書き換える」のではなく「作り直す」

**React で最も間違えやすいポイント。**

```tsx
// ✗ 絶対にやってはいけない
tasks.push(newTask)
tasks[0].done = true

// ○ 新しい配列・新しいオブジェクトを作る
setTasks((prev) => [...prev, newTask])
```

### なぜ「作り直す」必要があるのか

React は state が変わったかを **参照の比較**（`Object.is`）で判定する。
中身を1つずつ見比べるのは重すぎるからだ。

```
prev ─┐
      ├──▶ [同じ配列オブジェクト]     ← push は中身を変えるだけ。参照は変わらない
next ─┘                                → React は「変わってない」と判定 → 再描画されない

prev ────▶ [配列A]
next ────▶ [配列B]（新しく作った）     ← 参照が違う
                                        → React は「変わった」と判定 → 再描画される
```

`push` は**同じ配列の中身をいじる**ので、React から見ると何も変わっていない。
だから**新しい配列を作って渡す**必要がある。

### 3つの操作の型

このコードで使っている 3パターン。丸暗記して構わない。

**追加 — スプレッド構文**

```tsx
setTasks((prev) => [...prev, newTask])
```

`...prev` で「元の要素を全部展開」し、末尾に `newTask` を足した**別の配列**を作る。

**1件だけ書き換え — `map` + オブジェクトのスプレッド**

```tsx
setTasks((prev) =>
  prev.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  ),
)
```

`map` は必ず新しい配列を返すので、配列レベルはこれで OK。
さらに**該当する1件は `{ ...task, done: !task.done }` で新しいオブジェクトに差し替える**。
`...task` で全フィールドをコピーし、`done` だけ後ろで上書きしている。
該当しないタスクは `task` をそのまま返す（作り直す必要がない）。

**削除 — `filter`**

```tsx
setTasks((prev) => prev.filter((task) => task.id !== id))
```

`filter` も新しい配列を返す。「消す」ではなく**「残すものだけ集めた新しい配列を作る」**。

### 使ってよいメソッド / だめなメソッド

| | 配列 | 理由 |
|---|---|---|
| ○ 使う | `map` / `filter` / `slice` / `concat` / スプレッド | 新しい配列を返す |
| ✗ 避ける | `push` / `pop` / `splice` / `sort` / `reverse` | 元の配列を書き換える |

`sort` をどうしても使いたければ、**コピーしてから**。

```tsx
setTasks((prev) => [...prev].sort((a, b) => a.title.localeCompare(b.title)))
```

---

## 2-5. `setTasks((prev) => ...)` の形

set 関数には **値を直接渡す形**と、**関数を渡す形**の 2通りがある。

```tsx
setTasks([...tasks, newTask])          // 値を渡す
setTasks((prev) => [...prev, newTask]) // 関数を渡す（このコードはこちら）
```

関数を渡すと、React が**その時点での最新の値**を `prev` に入れて呼んでくれる。

### なぜそちらが安全なのか

state の更新は**即座には起きない**。set 関数は「次のレンダリングでこの値にして」という
**予約**であり、レンダリング中の `tasks` は最後まで古い値のまま（スナップショット）。

有名な例で見るとわかりやすい。

```tsx
// ✗ 2回書いても、1しか増えない
setCount(count + 1)
setCount(count + 1)

// ○ ちゃんと 2 増える
setCount((c) => c + 1)
setCount((c) => c + 1)
```

上は `count` が `0` に固定されているので、`setCount(1)` を 2回予約しただけ。
下は「今の値に +1 する手順」を 2回予約するので、`0 → 1 → 2` と積み上がる。

**迷ったら関数を渡す形にしておく**、で問題ない。
（同じ理由で、React は複数の set をまとめて 1回の再レンダリングに束ねる。これを**バッチ処理**という）

---

## 2-6. 制御コンポーネント — 入力欄の文字も state

`TaskForm` の中身。

```tsx
const [title, setTitle] = useState('')

<input
  value={title}                                        // ① state を表示する
  onChange={(event) => setTitle(event.target.value)}   // ② 打たれたら state を更新
/>
```

この 2つがセットになった入力欄を **制御コンポーネント**と呼ぶ。
Step 1 で `readOnly` を付けていたのは、①だけあって②がなかったから。今は両方あるので外した。

一見遠回りに見える。「打った文字は勝手に入力欄に入るのに、なぜ state に入れ直すのか」と。
理由は、**入力中の値を React 側から扱えるようになる**こと。

```tsx
onAdd(trimmed)
setTitle('')      // ← 送信後に入力欄を空にできる（state だから可能）
```

このほか「空文字なら追加しない」「文字数制限」「入力に応じてボタンを無効化」といった処理は、
値が state にあってこそ書ける。

> `value` を渡さない入力欄（**非制御コンポーネント**）も作れるが、
> React では制御コンポーネントが基本。

### `title.trim()`

```tsx
const trimmed = title.trim()
if (trimmed === '') return
```

前後の空白を除き、空なら何もせず抜ける（早期リターン）。
**バリデーションは `TaskForm` の中**でやっている。「入力が妥当か」はフォームの責務だから。

---

## 2-7. state の持ち上げ（lifting state up）

state をどのコンポーネントに置くか、は React 設計の要。判断基準はひとつ。

> **その state を必要とするコンポーネント全員の、いちばん近い共通の親に置く**

このアプリでは:

| state | 置き場所 | 理由 |
|---|---|---|
| `tasks` | `App` | `TaskList`（表示）と `TaskForm`（追加）の両方が関わる → 共通の親 |
| `title` | `TaskForm` | 入力中の文字は `TaskForm` しか使わない → その場に置く |

`title` を `App` に上げてもいいが、**関係ないコンポーネントまで再レンダリングされる**うえ、
`App` が余計なことを知りすぎる。**必要な場所より上には上げない**のが原則。

### 子はどうやって親の state を変えるのか

props は読み取り専用（Step 1）だった。ではどうするか。
**親が「更新する関数」を props として渡す。**

```tsx
// 親 App
<TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />

// 子 TaskItem — 押されたら id を報告するだけ
<input checked={task.done} onChange={() => onToggle(task.id)} />
```

子は **state を持たないし、更新方法も知らない**。「t2 が押されました」と報告するだけ。
どう更新するかは親が決める。この役割分担が React の基本形。

```
   データ（tasks）  ────────▶  下へ
   イベント（onToggle）  ◀────  上へ
```

props 名を `onToggle` / `onDelete` / `onAdd` と `on〜` で始めるのは慣例
（渡す側の関数は `handle〜`）。

### 途中のコンポーネントは中継するだけ

`TaskList` は `onToggle` を使わず、そのまま `TaskItem` に渡している。
こういう中継は React でよくあり、**props のバケツリレー**と呼ばれる。
今の規模なら問題ないが、深くなると辛いので、その場合は Context や状態管理ライブラリを使う。

---

## 2-8. 派生した値は state にしない

「残り件数」は `useState` を使っていない。

```tsx
const remaining = tasks.filter((task) => !task.done).length
```

`tasks` から**毎回計算している**。ここを state にすると、こうなる。

```tsx
// ✗ こうしてはいけない
const [remaining, setRemaining] = useState(2)

function handleAdd(title: string) {
  setTasks(...)
  setRemaining(remaining + 1)    // ← 更新を忘れた瞬間、表示が壊れる
}
```

タスクを変更するすべての箇所で `remaining` も直さないと、数字がズレる。
これは Step 0 で見た「命令的なやり方の破綻」そのもの。

> **他の state から計算できる値は、state にしない。レンダリングのたびに計算する。**

再レンダリングは頻繁に起きるが、`filter` 程度の計算は無視できるコストなので気にしなくてよい
（本当に重い計算のときだけ `useMemo` という手段がある）。

この考え方は Step 3 の「絞り込み」でもう一度、より大きな形で出てくる。

---

## 2-9. 今のコードの限界

| 挙動 | 原因 |
|---|---|
| **リロードするとタスクが消える** | state はメモリ上のデータ。ページを離れれば失われる |
| 絞り込みができない | 未実装 |

データを保存するには、React の外の世界（ブラウザのストレージ）に触る必要がある。
そのための仕組みが **`useEffect`**。それが Step 3。

なお `crypto.randomUUID()` はブラウザ標準の ID 生成関数。
`id` は重複しないことだけが要件なので、これで十分。

---

## 2-10. まとめ

- **`useState`** は `[値, 更新関数]` を返す。普通の変数では①再描画されず②毎回初期化されるので使えない
- set 関数を呼ぶ → React が再レンダリングを予約 → 関数が再実行され、差分だけ DOM に反映
- イベントは `onClick={handleFoo}`（**呼ばずに渡す**）。引数が必要なら `() => foo(id)` で包む
- state は**イミュータブルに更新**する。参照が変わらないと React は変化に気づかない
  - 追加 `[...prev, x]` / 更新 `map` + `{...task, done: !task.done}` / 削除 `filter`
  - `push` `splice` `sort` は元を壊すので避ける
- set は**予約**であって即時反映されない。だから `setX((prev) => ...)` の形が安全
- 入力欄は `value` + `onChange` の **制御コンポーネント**にする
- state は**必要なコンポーネント全員の共通の親**に置く。それ以上は上げない
- 子は state を変えない。親から渡された **`on〜` 関数でイベントを報告する**
- **他の state から計算できる値は state にしない**（`remaining` は毎回計算）

| 用語 | 意味 |
|---|---|
| **イミュータブル更新** | 元のデータを書き換えず、新しいデータを作って差し替えること |
| **スプレッド構文** | `[...arr]` / `{...obj}` で中身を展開してコピーする JS の記法 |
| **バッチ処理** | 複数の state 更新をまとめて 1回の再レンダリングにすること |
| **state の持ち上げ** | 共有したい state を共通の親に移すこと |
| **props のバケツリレー** | 使わない props を下へ中継し続けること |
| **派生した値** | 他の state から計算できる値。state にしない |

---

← 前は [Step 1: 画面を作る（静的 UI）](./01-components-props.md)
→ 次は **Step 3: 絞り込みと永続化**（派生した値、`useEffect`、localStorage）
