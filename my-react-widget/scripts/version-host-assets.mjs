import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// The portfolio loads predictable bundle names. Give each build a new cache
// key when its contents change, so returning visitors get the updated widget.
const hostUrl = new URL('../../index.html', import.meta.url);
const original = await readFile(hostUrl, 'utf8');
let html = original;

for (const extension of ['js', 'css']) {
  const asset = await readFile(new URL(`../dist/assets/react-widget.${extension}`, import.meta.url));
  const version = createHash('sha256').update(asset).digest('hex').slice(0, 12);
  const path = `my-react-widget/dist/assets/react-widget.${extension}`;
  const reference = new RegExp(`${path.replaceAll('.', '\\.')}(?:\\?v=[a-f0-9]+)?(?=")`, 'g');

  if ([...html.matchAll(reference)].length !== 1) {
    throw new Error(`Expected one host reference to ${path}`);
  }

  html = html.replace(reference, `${path}?v=${version}`);
}

if (html !== original) await writeFile(hostUrl, html);
console.log('Portfolio bundle URLs updated with content versions.');
