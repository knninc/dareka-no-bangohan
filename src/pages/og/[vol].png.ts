import type { APIRoute, GetStaticPaths } from 'astro';
import { getIssues, menuLine, type Issue } from '../../lib/issues';
import { genreById } from '../../lib/genres';
import { pad3, dateDots } from '../../lib/format';
import { renderOg } from '../../lib/og';

/** 号ごとの OGP 画像： /og/001.png */
export const getStaticPaths = (async () => {
  const issues = await getIssues();
  return issues.map((issue) => ({ params: { vol: pad3(issue.data.vol) }, props: { issue } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { data } = (props as { issue: Issue }).issue;
  const genre = genreById(data.genre);
  const png = await renderOg({
    vol: `VOL.${pad3(data.vol)}`,
    date: dateDots(data.date),
    genreName: genre.name,
    genreMark: genre.mark,
    genreColor: genre.color,
    titleLines: data.titleLines?.length ? data.titleLines : [data.title],
    subtitle: data.subtitle,
    footer: `献立　${menuLine((props as { issue: Issue }).issue, '／')}`,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
