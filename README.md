# 週刊・誰かの晩ごはん

> 毎週、誰かの人生を、晩ごはんだけ借りてみる。

ふたりが別々の台所で、オンライン通話をつなぎながら、毎週ひとり「誰か」の晩ごはんを想像して作って食べる。その記録のための小さなウェブマガジンです。

特に目的はありません。

---

## もくじ

- [技術構成](#技術構成)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発環境の起動](#開発環境の起動)
- [新しい号を追加する](#新しい号を追加する)
- [写真を追加する](#写真を追加する)
- [チェックとビルド](#チェックとビルド)
- [公開する（静的ホスティング）](#公開する静的ホスティング)
- [デザインと編集の約束](#デザインと編集の約束)

---

## 技術構成

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| サイト生成 | [Astro](https://astro.build) 7（静的出力） | コンテンツ中心。JSを配らずに済み、表示が速い |
| 言語 | TypeScript | コンテンツの型（号数・ジャンルなど）をビルド時に検査できる |
| コンテンツ | Markdown ＋ frontmatter（Content Collections） | 毎週、ファイルを1つ書くだけで号が増える |
| スタイル | 素の CSS（カスタムプロパティ） | 雑誌的な組版を細かく作るため。Tailwind は使わない |
| 書体 | Fontsource（セルフホスト、OFL） | 外部CDNに頼らない。必要な文字の分だけ読み込まれる |
| 画像 | `astro:assets`（sharp） | 写真を AVIF / WebP に自動変換・リサイズ |
| OGP画像 | satori ＋ sharp | 号ごとのSNS用画像をビルド時に自動生成 |
| RSS / サイトマップ | `@astrojs/rss` / `@astrojs/sitemap` | |

ブラウザに送る JavaScript は **0 KB** です（絞り込みもページ遷移で実現）。

**書体**

- 明朝：Shippori Mincho B1（見出し 800 / 本文 500）
- ゴシック：Zen Kaku Gothic New（ラベル・ナビ）
- 欧文等幅：IBM Plex Mono（号数・日付）

いずれも SIL Open Font License 1.1。

---

## ディレクトリ構成

```text
.
├── src/
│   ├── content/issues/       ← 号のデータ（1号 = 1フォルダ）
│   │   └── 001/
│   │       ├── index.md      ← 号の本文と情報
│   │       └── photos/       ← 実際に撮った写真（任意）
│   ├── content.config.ts     ← 号のデータの型（必須項目の定義）
│   ├── site.config.ts        ← サイト名・コピー・台所の呼び名
│   ├── lib/                  ← ジャンル定義、日付、Markdown、OGP など
│   ├── components/           ← 題字、皿の図、背表紙、目次行 など
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro       ← 表紙（トップ）
│   │   ├── archive/          ← バックナンバー（/archive/ と ジャンル別）
│   │   ├── vol/[vol].astro   ← 号の詳細（/vol/001/）
│   │   ├── about.astro       ← この活動について
│   │   ├── 404.astro
│   │   ├── og/[vol].png.ts   ← 号ごとの OGP 画像
│   │   ├── rss.xml.ts / robots.txt.ts / og-default.png.ts
│   └── styles/global.css     ← 色・書体・余白のトークンと基本の組版
├── templates/issue.md        ← 新しい号のひな形
├── scripts/
│   ├── new-issue.mjs         ← npm run new-issue
│   └── check-content.mjs     ← npm run check:content
├── docs/
│   ├── EDITORIAL.md          ← 編集の約束（書くときに読む）
│   └── DESIGN.md             ← デザインの考え方
└── public/                   ← favicon など
```

### URL

| URL | 内容 |
| --- | --- |
| `/` | 表紙 |
| `/archive/` | バックナンバー（すべて） |
| `/archive/modern/` `past/` `fantasy/` `faith/` | ジャンル別 |
| `/vol/001/` | 号の詳細 |
| `/about/` | この活動について |
| `/rss.xml` `/sitemap-index.xml` | RSS・サイトマップ |

---

## 開発環境の起動

Node.js 22.12 以上が必要です（`.nvmrc` あり）。

```sh
npm install
npm run dev
```

http://localhost:4321 で開きます。ファイルを保存すると自動で反映されます。

---

## 新しい号を追加する

コンポーネントを触る必要はありません。**Markdown ファイルを1つ書くだけ**です。

### 1. ひな形を作る

```sh
npm run new-issue
```

- 号数は「最新号 + 1」、日付は「最新号の7日後」、ジャンルは「最新号の次」（現代人 → 昔の人 → ファンタジー → 海外の宗教）で作られます。
- 指定したいときは：

```sh
npm run new-issue -- --genre past --date 2026-10-20
```

`src/content/issues/002/index.md` と `photos/` フォルダができます。

### 2. 書く

```yaml
---
vol: 2
date: 2026-10-20
genre: past          # modern / past / fantasy / faith
draft: true          # 書き終わったら false

title: 江戸時代の農民、年貢を納めたあとの夕食。
titleLines:          # 表示用の改行位置（任意）
  - 江戸時代の農民、
  - 年貢を納めたあとの夕食。
subtitle: ……

menu:
  - name: 一品目
  - name: 二品目
    note: 参照したレシピなど一言
---

## 今夜の誰か
……

## なぜこの料理なのか
【史実】……
【推定】……
```

本文は **決まった見出し** で区切ると、ページの決まった欄に入ります。

| 見出し | ページでの欄 | しるし |
| --- | --- | --- |
| `## 今夜の誰か` | 01 今夜の誰か | 想像 |
| （frontmatter の `menu`） | 02 今夜の献立 | 献立 |
| `## なぜこの料理なのか` | 03 なぜこの料理なのか | 解説 |
| `## レシピ` ＋ `recipes` | 04 レシピ | 資料 |
| `## ふたりの食卓` ＋ `photos` | 05 ふたりの食卓 | 記録 |
| `## 編集後記` | 06 編集後記 | 記録 |

- 書かなかった欄は表示されず、番号は自動で詰まります。
- 写真も「ふたりの食卓」もない号には「記録待ち」と表示されます。
- 段落の先頭に `【史実】` `【推定】` `【再現】` `【創作】` `【設定】` `【伝承】` `【記録】` と書くと、根拠の種類を示すしるしになります。
- 決まっていない見出しを書くとエラーで教えてくれます。

### 3. 公開する

`draft: false` にして、GitHub に push すると（ホスティング連携後は）自動で公開されます。

---

## 写真を追加する

1. 号のフォルダの `photos/` に写真を置く（JPEG / PNG / WebP。iPhone の HEIC は JPEG にしてから。長辺 2000px 程度で十分）
2. `index.md` の `photos` に書く

```yaml
photos:
  - src: ./photos/a-1.jpg
    alt: 台所Aの食卓。八宝菜、トマたま、冷奴が並んでいる
    kitchen: a        # a = 台所A / b = 台所B
    cover: true       # 表紙・SNS画像に使う1枚（任意）
    caption: 一言（任意）
  - src: ./photos/b-1.jpg
    alt: 台所Bの食卓
    kitchen: b
```

- 台所A・台所B の両方の写真があると、通話画面のように**左右に並びます**。
- `alt`（何が写っているか）は必須です。
- 写真はビルド時に AVIF / WebP に変換・縮小されるので、元画像のサイズは気にしなくて大丈夫です。
- **実際に撮った写真だけ** を載せます。AI生成画像を記録として載せません。
- 台所の呼び名（台所A / 台所B）は `src/site.config.ts` で変えられます。

---

## チェックとビルド

```sh
npm run check:content   # 号のデータだけを検査（速い）
npm run check           # 号のデータ ＋ TypeScript / Astro の型検査
npm run build           # 本番ビルド（dist/ に出力。前に check:content が自動で走る）
npm run preview         # ビルド結果をローカルで確認
```

`check:content` が見つけるもの：

- 号数の重複、フォルダ名（`002`）と `vol` の不一致、欠番
- 必須項目（`vol` `date` `genre` `title` `menu`）の欠落、ジャンルの誤り
- 使えない本文見出し、同じ見出しの重複
- 写真ファイルが見つからない、`alt` がない
- 日付が前の号より前

GitHub Actions（`.github/workflows/ci.yml`）でも、push / pull request のたびに同じ検査とビルドを行います。

---

## 公開する（静的ホスティング）

ビルド結果は `dist/` の静的ファイルだけなので、どこでも公開できます。

| 設定 | 値 |
| --- | --- |
| ビルドコマンド | `npm run build` |
| 出力ディレクトリ | `dist` |
| Node.js | 22 |
| 環境変数 | `SITE_URL` = 公開URL（例 `https://example.com`） |

`SITE_URL` は canonical・OGP・RSS・サイトマップの URL に使われます。**本番では必ず設定してください**（未設定だと `http://localhost:4321` になります。Vercel では本番URLを自動で使います）。

- **Cloudflare Pages**：リポジトリを接続 → Framework preset「Astro」→ 上の表のとおり設定。`public/_headers` でフォントや画像に長期キャッシュが付きます。
- **Vercel**：リポジトリを読み込むだけで Astro を自動認識します。

> 公開先の決定、リポジトリの公開、ドメインの取得は、まだ行っていません。

---

## デザインと編集の約束

- [docs/DESIGN.md](docs/DESIGN.md) — 色・書体・版面・コンポーネントの考え方
- [docs/EDITORIAL.md](docs/EDITORIAL.md) — 記録と想像の区別、歴史・宗教・ファンタジー・現代人を書くときの約束

いちばん大事な約束：**実際に作った記録と、想像上の設定を混ぜない。** 開催していない回、食べていない感想、撮っていない写真は載せません。
