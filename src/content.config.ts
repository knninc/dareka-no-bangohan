import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { GENRE_IDS } from './lib/genres';
import { SITE } from './site.config';

const KITCHEN_IDS = Object.keys(SITE.kitchens) as [string, ...string[]];

/** 参考資料。url は実際に確認できたものだけを書く。 */
const source = z.object({
  title: z.string().min(1),
  publisher: z.string().optional(),
  url: z.url().optional(),
  note: z.string().optional(),
});

/**
 * 号（issue）
 * 1号 = 1フォルダ： src/content/issues/<3桁の号数>/index.md
 * 写真は同じフォルダの photos/ に置く。
 */
const issues = defineCollection({
  loader: glob({ base: './src/content/issues', pattern: '*/index.md' }),
  schema: ({ image }) =>
    z
      .object({
        /** 号数（1, 2, 3 …）。フォルダ名の3桁と一致させる */
        vol: z.number().int().positive(),
        /** 開催日 YYYY-MM-DD */
        date: z.coerce.date(),
        /** modern | past | fantasy | faith */
        genre: z.enum(GENRE_IDS),
        /** 題（誰の、どんな晩ごはんか） */
        title: z.string().min(1),
        /** 表示用の改行位置（任意）。つなげると title と同じになること */
        titleLines: z.array(z.string().min(1)).optional(),
        /** 副題 */
        subtitle: z.string().optional(),
        /** 一覧・検索結果・SNS用の短い説明（任意。なければ副題と献立から作る） */
        summary: z.string().optional(),
        /** 今夜の献立 */
        menu: z
          .array(
            z.object({
              name: z.string().min(1),
              /** 一言（例：ニチレイのレシピを参照） */
              note: z.string().optional(),
            }),
          )
          .min(1, '献立（menu）を1品以上書いてください'),
        /** レシピ。材料・作り方は確認できたものだけ */
        recipes: z
          .array(
            z.object({
              dish: z.string().min(1),
              servings: z.string().optional(),
              ingredients: z
                .array(z.union([z.string(), z.object({ name: z.string(), amount: z.string().optional() })]))
                .optional(),
              steps: z.array(z.string()).optional(),
              sources: z.array(source).optional(),
              note: z.string().optional(),
            }),
          )
          .default([]),
        /** 号全体の参考資料（歴史・宗教の回など） */
        sources: z.array(source).default([]),
        /** 実際に撮った写真だけを載せる（AI生成画像を記録として載せない） */
        photos: z
          .array(
            z.object({
              src: image(),
              alt: z.string().min(1, '写真の alt（何が写っているか）を書いてください'),
              kitchen: z.enum(KITCHEN_IDS).optional(),
              caption: z.string().optional(),
              /** true の写真を表紙・OGP に使う */
              cover: z.boolean().optional(),
            }),
          )
          .default([]),
        /** true の号は本番ビルドに出さない（開発サーバーでは見える） */
        draft: z.boolean().default(false),
      })
      .refine((d) => !d.titleLines || d.titleLines.join('') === d.title, {
        message: 'titleLines をつなげた文字列が title と一致していません',
        path: ['titleLines'],
      }),
});

export const collections = { issues };
