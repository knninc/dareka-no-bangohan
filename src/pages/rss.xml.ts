import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../site.config';
import { genreById } from '../lib/genres';
import { getIssues, issueUrl, issueDescription } from '../lib/issues';
import { pad3 } from '../lib/format';

export const GET: APIRoute = async (context) => {
  const issues = await getIssues();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    items: issues.map((issue) => ({
      title: `VOL.${pad3(issue.data.vol)} ${issue.data.title}`,
      link: issueUrl(issue),
      pubDate: issue.data.date,
      description: issueDescription(issue),
      categories: [genreById(issue.data.genre).name],
    })),
    customData: `<language>ja</language>`,
  });
};
