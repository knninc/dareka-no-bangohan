/**
 * 縦書き用の整形。HTML 文字列を返す（set:html で使う）。
 * - 1〜2桁の数字、2文字の大文字 → 縦中横（tcy）
 * - 3〜4桁の数字、3〜5文字の大文字略語（1000、GPT など） → 一字ずつ正立（upright）
 * - それ以外の欧文 → 横倒し（mixed のまま）
 */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function tate(text: string): string {
  return escapeHtml(text).replace(/[A-Za-z0-9!?]+/g, (run) => {
    if (/^[0-9]{1,2}$/.test(run) || /^[A-Z]{2}$/.test(run) || /^[!?]{1,2}$/.test(run)) {
      return `<span class="tcy">${run}</span>`;
    }
    if (/^[A-Z]{3,5}$/.test(run) || /^[0-9]{3,4}$/.test(run)) {
      return `<span class="upright">${run}</span>`;
    }
    return run;
  });
}
