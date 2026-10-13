// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** 本番の公開URL（Cloudflare Workers の workers.dev）。独自ドメインにしたら SITE_URL で上書きする */
const PRODUCTION_URL = 'https://dareka-no-bangohan.super-bonus-c87c.workers.dev';

/**
 * 公開URL（canonical・OGP・RSS・サイトマップに使う）。
 * 1. 環境変数 SITE_URL（独自ドメインにしたらビルド変数に設定する）
 * 2. Cloudflare Workers Builds でのビルド（WORKERS_CI=1）なら本番URL
 * 3. それ以外（ローカル・GitHub Actions）は localhost
 */
const site = process.env.SITE_URL || (process.env.WORKERS_CI ? PRODUCTION_URL : 'http://localhost:4321');

/**
 * Fontsource の CSS は woff2 と woff の両方を参照している。
 * 対象ブラウザはすべて woff2 に対応しているので、woff を外して出力を半分にする。
 * @returns {import('vite').Plugin}
 */
function woff2Only() {
  return {
    name: 'dareka:woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!/[\\/]@fontsource[\\/].+\.css(\?.*)?$/.test(id)) return;
      return code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
    },
  };
}

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: {
    plugins: [woff2Only()],
  },
});
