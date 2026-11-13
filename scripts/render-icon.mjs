#!/usr/bin/env node
// Renders docs/icon-source.svg to .claude-plugin/icon.png (1024x1024) with headless Chrome, Edge or Chromium.
// Usage: npm run icon            (set CHROME_PATH to pick a specific browser executable)
//        node scripts/render-icon.mjs [source.svg] [output.png]
// The existing icon is replaced only if the render is the right size and not blank.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SIZE = 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.argv[2] ?? path.join(root, 'docs/icon-source.svg'));
const out = path.resolve(process.argv[3] ?? path.join(root, '.claude-plugin/icon.png'));

function findBrowser() {
  if (process.env.CHROME_PATH) return fs.existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
  const env = process.env;
  const candidates = {
    win32: [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean).flatMap((base) => [
      path.join(base, 'Google/Chrome/Application/chrome.exe'),
      path.join(base, 'Microsoft/Edge/Application/msedge.exe')
    ]),
    darwin: ['Google Chrome', 'Chromium', 'Microsoft Edge'].map((n) => `/Applications/${n}.app/Contents/MacOS/${n}`),
    linux: (env.PATH ?? '').split(path.delimiter).flatMap((dir) =>
      ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'].map((n) => path.join(dir, n)))
  }[process.platform] ?? [];
  return candidates.find((p) => fs.existsSync(p));
}

const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

// Minimal decoder for the 8-bit, non-interlaced RGB/RGBA PNGs that Chromium screenshots produce.
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('screenshot is not a PNG');
  let off = 8, ihdr;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4), bpp = { 2: 3, 6: 4 }[ihdr[9]];
  if (ihdr[8] !== 8 || !bpp || ihdr[12] !== 0) throw new Error('unsupported PNG format from browser');
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * bpp, px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], row = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      px[y * stride + x] = (raw[row + x] + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]) & 255;
    }
  }
  return { width, height, bpp, px };
}

// Re-encode as RGB with the Paeth filter and maximum compression (Chromium's output is ~4x larger).
const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const byte of buf) c = CRC[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePngRgb({ width, height, bpp, px }) {
  const stride = width * 3, raw = Buffer.alloc((stride + 1) * height), rgb = (x, y) => px.subarray((y * width + x) * bpp, (y * width + x) * bpp + 3);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 4;
    for (let x = 0; x < width; x++) {
      const cur = rgb(x, y);
      for (let ch = 0; ch < 3; ch++) {
        const a = x ? rgb(x - 1, y)[ch] : 0, b = y ? rgb(x, y - 1)[ch] : 0, c = x && y ? rgb(x - 1, y - 1)[ch] : 0;
        raw[y * (stride + 1) + 1 + x * 3 + ch] = (cur[ch] - paeth(a, b, c)) & 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const browser = findBrowser();
if (!browser) {
  const where = process.env.CHROME_PATH ? ` at CHROME_PATH (${process.env.CHROME_PATH})` : '';
  console.error(`No Chrome, Edge or Chromium found${where}. Set CHROME_PATH to a Chromium-based browser executable.`);
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`Icon source not found: ${src}`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stepback-icon-'));
const shot = path.join(tmp, 'shot.png');
const runBrowser = (...args) => execFileSync(browser, ['--headless', '--disable-gpu', `--user-data-dir=${path.join(tmp, 'profile')}`,
  ...args, pathToFileURL(src).href], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000 });
try {
  // A malformed SVG still renders: Chrome shows an error banner plus the part before the error. Its DOM gets a <parsererror>.
  if (runBrowser('--dump-dom').includes('parsererror')) {
    throw new Error('the SVG is not well-formed XML (for example, "--" inside a comment). Open it in a browser to see the error');
  }
  runBrowser('--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${SIZE},${SIZE}`, `--screenshot=${shot}`);
  if (!fs.existsSync(shot)) throw new Error('the browser did not write a screenshot');
  const image = decodePng(fs.readFileSync(shot));
  if (image.width !== SIZE || image.height !== SIZE) throw new Error(`expected ${SIZE}x${SIZE}, got ${image.width}x${image.height}`);
  const colors = new Set();
  for (let i = 0; i < image.px.length && colors.size < 3; i += image.bpp) colors.add(image.px.readUIntBE(i, 3));
  if (colors.size < 3) throw new Error('the render is blank');
  const png = encodePngRgb(image);
  fs.writeFileSync(out, png);
  console.log(`Rendered ${path.relative(root, src)} -> ${path.relative(root, out)} (${SIZE}x${SIZE}, ${Math.round(png.length / 1024)} KB)`);
} catch (error) {
  console.error(`Icon not updated: ${error.message}`);
  process.exitCode = 1;
} finally {
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temp dir; ignore */ }
}
