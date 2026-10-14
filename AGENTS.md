# AGENTS.md — 週刊・誰かの晩ごはん

毎週ひとり「誰か」の晩ごはんを想像して作って食べる、ふたりの活動のウェブマガジン。Astro 7 の静的サイト。

## 最初に読むもの

- `README.md` — 構成、号の追加、写真、ビルド、公開
- `docs/EDITORIAL.md` — 編集の約束（**必ず守る**）
- `docs/DESIGN.md` — 色・書体・部品の考え方

## ナレッジ（参考資料）

`docs/knowledge/` に置く。必要なときに読む参考資料で、サイトには出ない。

- `docs/knowledge/栄養学_深い解説書_2026.md` — 五大栄養素・33項目、PFC、食事摂取基準（2025年版）の読み方。献立や解説で栄養に触れるときの確認用。号の料理について栄養の数値や健康効果を書くときは、実際の分量で確かめたことだけにする。

## 守ること

- 実際に作った記録と想像上の設定を混ぜない。開催していない号、食べていない感想、参加者の発言、撮っていない写真、未確認のURLを作らない。
- AI生成画像を料理写真として載せない。
- 写真は `npm run import-photos` で取り込む（撮影場所などのメタデータを消す。リポジトリは公開）。
- 写真と感想は、共有の Google ドライブ「週刊・誰かの晩ごはん」の号ごとのフォルダ（台所A/B の写真、「VOL.xxx の記録」ドキュメント）に集まる。
- 参加者の個人名・プロフィールを載せない（台所A / 台所B）。
- 集客・収益化・KPI などの目的を勝手に足さない。「特に目的はありません。」
- 料理ブログのテンプレート、カードUIの羅列、SaaS風のLPにしない。

## コマンド

```sh
npm run dev              # 開発サーバー（http://localhost:4321）
npm run new-issue        # 新しい号のひな形
npm run import-photos -- <号数> <a|b> <写真>  # 写真の取り込み（位置情報を消す。写真は必ずこれで入れる）
npm run import-from-drive -- <号数>            # Google ドライブ（パソコン版）の号のフォルダから台所A/Bの写真を一括取り込み
npm run check            # 号のデータ検査 + astro check
npm run build            # 本番ビルド（dist/）
npm run deploy           # 手元から Cloudflare Workers に公開（通常は main への push で自動公開）
```

開発サーバーをバックグラウンドで動かすときは `npx astro dev --background`（`astro dev stop` / `status` / `logs`）。

## 実装の約束

- 号は `src/content/issues/<3桁>/index.md`。スキーマは `src/content.config.ts`。
- コラムは `src/content/columns/<3桁>/index.md`（`/column/<3桁>/`）。号と同じ編集の約束を守る。
- 本文の見出しは `src/lib/sections.ts` の `BODY_SECTIONS` だけ。増やすときは `scripts/lib.mjs` の `BODY_HEADINGS` も直す。
- ジャンルは `src/lib/genres.ts`。色は `src/styles/global.css` の `--g-*` と `genres.ts` の `color` をそろえる。
- 台所の呼び名は `src/site.config.ts` の `kitchens`。増やすときは `scripts/lib.mjs` の `KITCHENS` も直す。
- スタイルは素の CSS（トークンは `global.css`、部品は各 `.astro` の scoped style）。クライアント JS は使っていない。
- Astro 7 は Rust コンパイラ：閉じていないタグや不正な入れ子はビルドエラーになる。
- 変更したら、スマホ幅（390px）とデスクトップ幅（1440px）の両方で見た目を確認する。
