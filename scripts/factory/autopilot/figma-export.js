// Download original Figma exports. The token is read from the environment and never logged/stored.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, read, write, inside, hash } = require('./common');
const { extractFigmaFileKey } = require('../figma/utils');
async function request(url, authenticated = false) {
  const response = await fetch(url, { headers: authenticated ? { 'X-Figma-Token': process.env.FIGMA_TOKEN } : {}, signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`FIGMA_HTTP_${response.status}; retry-after=${response.headers.get('retry-after') || 'not supplied'}`);
  return response;
}
async function main() {
  const args = process.argv.slice(2);
  const opts = Object.fromEntries(Array.from({ length: args.length / 2 }, (_, i) => [args[i * 2].replace(/^--/, ''), args[i * 2 + 1]]));
  if (!process.env.FIGMA_TOKEN) throw new Error('FIGMA_TOKEN unavailable. Use authenticated Figma MCP export/download instead; do not invent an asset.');
  if (!opts.node || !opts.output || !['png', 'svg', 'jpg'].includes(opts.format || 'png')) throw new Error('Usage: --node <id> --output <snapshot-relative-path> --format png|svg|jpg');
  const fileKey = extractFigmaFileKey(read(path.join(ROOT, 'factory/project.json')).figma.url);
  const format = opts.format || 'png';
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(opts.node)}&format=${format}&scale=1`;
  const response = await (await request(url, true)).json();
  const source = response.images?.[opts.node];
  if (!source) throw new Error(`Figma did not export ${opts.node}: ${response.err || 'no image'}`);
  const bytes = Buffer.from(await (await request(source)).arrayBuffer());
  const target = inside(SNAPSHOT, opts.output);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  const provenance = { fileKey, nodeId: opts.node, path: opts.output, format, scale: 1, capturedAt: new Date().toISOString(), sha256: hash(bytes), transport: 'figma-rest-export' };
  write(`${target}.source.json`, provenance);
  console.log(JSON.stringify(provenance));
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
