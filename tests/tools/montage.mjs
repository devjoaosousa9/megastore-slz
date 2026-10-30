// Visual QA: tile screenshots into one sheet so a whole scroll can be reviewed at once.
// node tests/tools/montage.mjs <out.png> <scale> <img...>
import sharp from 'sharp';

const [out, scaleArg, ...files] = process.argv.slice(2);
const scale = Number(scaleArg);
const tiles = await Promise.all(
  files.map(async (f) => {
    const meta = await sharp(f).metadata();
    const width = Math.round(meta.width * scale);
    const height = Math.round(meta.height * scale);
    return { input: await sharp(f).resize(width, height).toBuffer(), width, height };
  }),
);
const gap = 8;
const width = tiles.reduce((a, t) => a + t.width + gap, gap);
const height = Math.max(...tiles.map((t) => t.height)) + gap * 2;
let left = gap;
const composite = tiles.map((t) => {
  const c = { input: t.input, left, top: gap };
  left += t.width + gap;
  return c;
});
await sharp({ create: { width, height, channels: 3, background: '#ff00ff' } }).composite(composite).png().toFile(out);
console.log(out, width, height);
