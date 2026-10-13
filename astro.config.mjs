// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Cloudflare Pages のビルドでは CF_PAGES_URL に「https://<デプロイID>.<プロジェクト>.pages.dev」が入る。
 * デプロイIDを外して、本番の「https://<プロジェクト>.pages.dev」にする。
 */
function cloudflarePagesUrl() {
  const m = process.env.CF_PAGES_URL?.match(/^https:\/\/[^.]+\.([^.]+\.pages\.dev)\/?$/);
  return m ? `https://${m[1]}` : undefined;
}

/**
 * 公開URL（canonical・OGP・RSS・サイトマップに使う）。
 * 1. 環境変数 SITE_URL（独自ドメインにしたらここに設定する）
 * 2. Cloudflare Pages の *.pages.dev
 * 3. Vercel の本番URL
 * 4. ローカル
 */
const site =
  process.env.SITE_URL ||
  cloudflarePagesUrl() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

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
