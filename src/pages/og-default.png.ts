import type { APIRoute } from 'astro';
import { SITE } from '../site.config';
import { renderOg } from '../lib/og';

/** サイト共通の OGP 画像： /og-default.png */
export const GET: APIRoute = async () => {
  const png = await renderOg({
    titleLines: [...SITE.copy],
    footer: '現代人／昔の人／ファンタジー／海外の宗教',
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
