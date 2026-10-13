// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * 公開URL。本番ビルドでは環境変数 SITE_URL を設定する（例: https://example.com）。
 * 未設定の場合は Vercel の本番URL、最後にローカルURLを使う。
 */
const site =
  process.env.SITE_URL ||
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
