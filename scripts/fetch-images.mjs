import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'src/content/image-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const ids = new Set();

for (const image of manifest) {
  if (!image.id || !image.searchQuery || !image.orientation || !image.minimumWidth || !image.credit || !image.sourcePageUrl || !image.alt) throw new Error('Each image entry requires id, searchQuery, orientation, minimumWidth, credit, sourcePageUrl and alt.');
  if (ids.has(image.id)) throw new Error(`Duplicate image id: ${image.id}`);
  ids.add(image.id);
}

await mkdir(resolve(root, 'public/images'), { recursive: true });
const credits = manifest.map(image => `<li><strong>${image.id}</strong> · ${image.credit} · <a href="${image.sourcePageUrl}">${image.sourcePageUrl}</a></li>`).join('\n');
await writeFile(resolve(root, 'src/content/image-credits.html'), `<ul>${credits}</ul>`, 'utf8');
if (manifest.length) throw new Error('Image downloading requires a verified, licensed source asset URL in the manifest.');
