/**
 * OGP 画像（1200×630 PNG）をビルド時に作る。
 * Fontsource の woff を、必要な文字を含むチャンクだけ読み込んで satori で組版する。
 * ネットワークにもOSのフォントにも依存しない。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

const require = createRequire(path.join(process.cwd(), 'package.json'));

type Weight = 400 | 500 | 800;
interface FontSpec {
  pkg: string;
  file: string;
  name: string;
  weight: Weight;
}

const FONTS: FontSpec[] = [
  { pkg: '@fontsource/shippori-mincho-b1', file: '800.css', name: 'Mincho', weight: 800 },
  { pkg: '@fontsource/shippori-mincho-b1', file: '500.css', name: 'Mincho', weight: 500 },
  { pkg: '@fontsource/ibm-plex-mono', file: 'latin-500.css', name: 'Mono', weight: 500 },
  { pkg: '@fontsource/zen-kaku-gothic-new', file: '500.css', name: 'Gothic', weight: 500 },
];

interface Chunk {
  file: string;
  ranges: [number, number][];
}

const cssCache = new Map<string, Chunk[]>();

async function chunks(spec: FontSpec): Promise<Chunk[]> {
  const key = `${spec.pkg}/${spec.file}`;
  const hit = cssCache.get(key);
  if (hit) return hit;
  const dir = path.dirname(require.resolve(`${spec.pkg}/package.json`));
  const css = await fs.readFile(path.join(dir, spec.file), 'utf8');
  const out: Chunk[] = [];
  for (const block of css.split('@font-face').slice(1)) {
    const woff = block.match(/url\(\.\/files\/([^)]+\.woff)\)/);
    if (!woff) continue;
    const ur = block.match(/unicode-range:\s*([^;]+);/);
    const ranges: [number, number][] = ur
      ? ur[1].split(',').map((r) => {
          const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
          return [parseInt(a, 16), parseInt(b ?? a, 16)];
        })
      : [[0, 0x10ffff]];
    out.push({ file: path.join(dir, 'files', woff[1]), ranges });
  }
  cssCache.set(key, out);
  return out;
}

const fileCache = new Map<string, Buffer>();

/**
 * satori は同じ名前のフォントを1つにまとめてしまうので、チャンクごとに別名を付け、
 * fontFamily に「Mincho-0, Mincho-1, …」と並べて文字ごとに探させる（太さは weight で区別）。
 */
async function loadFonts(text: string) {
  const codes = [...new Set([...text].map((c) => c.codePointAt(0)!))];
  const fonts: { name: string; data: Buffer; weight: Weight; style: 'normal' }[] = [];
  const families: Record<string, string[]> = {};
  for (const spec of FONTS) {
    const list = (families[spec.name] ??= []);
    for (const [i, chunk] of (await chunks(spec)).entries()) {
      if (!codes.some((c) => chunk.ranges.some(([a, b]) => c >= a && c <= b))) continue;
      let data = fileCache.get(chunk.file);
      if (!data) {
        data = await fs.readFile(chunk.file);
        fileCache.set(chunk.file, data);
      }
      // 同じチャンク番号は太さ違いでも同じ名前にする（satori が weight で選べるように）
      const name = `${spec.name}-${i}`;
      fonts.push({ name, data, weight: spec.weight, style: 'normal' });
      if (!list.includes(name)) list.push(name);
    }
  }
  return { fonts, families };
}

/* ---- 最小の JSX 代わり ---- */
type Child = Node | string | null | undefined | false;
interface Node {
  type: string;
  props: Record<string, unknown> & { children?: Child | Child[] };
}
const h = (type: string, style: Record<string, unknown>, ...children: Child[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) as Child[] },
});

const C = {
  paper: '#f4eee2',
  sheet: '#f8f4ec',
  ink: '#1f1c18',
  ink2: '#4f4940',
  shu: '#c8381f',
};

export interface OgInput {
  /** 例: VOL.001 */
  vol?: string;
  genreName?: string;
  genreMark?: string;
  genreColor?: string;
  date?: string;
  titleLines: string[];
  subtitle?: string;
  footer: string;
}

function tree(o: OgInput, ff: (name: string) => string): Node {
  const titleSize = Math.max(...o.titleLines.map((l) => [...l].length)) > 12 ? 58 : 70;
  const color = o.genreColor ?? C.ink;

  return h(
    'div',
    {
      width: 1200,
      height: 630,
      backgroundColor: C.paper,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: ff('Mincho'),
      color: C.ink,
    },
    h(
      'div',
      {
        width: 1128,
        height: 558,
        flexDirection: 'column',
        border: `2px solid ${C.ink}`,
        backgroundColor: C.sheet,
        padding: '34px 48px 30px',
      },
      // 上段：題字と号数
      h(
        'div',
        {
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 18,
          borderBottom: `2px solid ${C.ink}`,
        },
        h(
          'div',
          { alignItems: 'center', gap: 14 },
          h(
            'div',
            { backgroundColor: C.shu, color: C.paper, fontSize: 22, fontWeight: 800, padding: '6px 9px 8px' },
            '週刊',
          ),
          h('div', { fontSize: 38, fontWeight: 800, letterSpacing: '0.02em' }, '誰かの晩ごはん'),
        ),
        h(
          'div',
          { alignItems: 'center', gap: 18, fontFamily: ff('Mono'), fontSize: 20, color: C.ink2, letterSpacing: '0.08em' },
          o.date ? h('div', {}, o.date) : null,
          o.vol ? h('div', { color, fontSize: 26 }, o.vol) : null,
        ),
      ),
      // 中段：題
      h(
        'div',
        { flex: 1, flexDirection: 'column', justifyContent: 'center', gap: 6 },
        o.genreName
          ? h(
              'div',
              { alignItems: 'center', gap: 12, marginBottom: 16, color, fontFamily: ff('Gothic'), fontSize: 22 },
              h(
                'div',
                {
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  border: `2.5px solid ${color}`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: ff('Mincho'),
                  fontWeight: 800,
                  fontSize: 22,
                },
                o.genreMark ?? '',
              ),
              h('div', { letterSpacing: '0.12em' }, o.genreName),
            )
          : null,
        ...o.titleLines.map((line) =>
          h('div', { fontSize: titleSize, fontWeight: 800, lineHeight: 1.32, letterSpacing: '0.02em' }, line),
        ),
        o.subtitle
          ? h(
              'div',
              { alignItems: 'center', gap: 14, marginTop: 18, fontSize: 30, fontWeight: 800 },
              h('div', { width: 44, height: 2, backgroundColor: C.shu }),
              o.subtitle,
            )
          : null,
      ),
      // 下段
      h(
        'div',
        {
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: 14,
          borderTop: `1px solid ${C.ink}`,
          fontSize: 22,
          fontWeight: 500,
          color: C.ink2,
        },
        h('div', {}, o.footer),
        h('div', { fontFamily: ff('Mono'), fontSize: 16, letterSpacing: '0.1em' }, 'WEEKLY · SOMEONE’S DINNER'),
      ),
    ),
  );
}

export async function renderOg(o: OgInput): Promise<Buffer> {
  const text =
    '週刊誰かの晩ごはんWEEKLY·SOMEONE’SDINNER0123456789.' +
    [o.vol, o.genreName, o.genreMark, o.date, ...o.titleLines, o.subtitle, o.footer].filter(Boolean).join('');
  const { fonts, families } = await loadFonts(text);
  // 和文の役割ごとに、読み込んだチャンク名を並べる（欧文は Mono→和文の順に探す）
  const ff = (name: string) =>
    [...(families[name] ?? []), ...(name === 'Mono' ? families.Mincho ?? [] : families.Mono ?? [])].join(', ');
  // satori の型は ReactNode を要求するが、同じ形のオブジェクトを渡せばよい
  const svg = await satori(tree(o, ff) as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
