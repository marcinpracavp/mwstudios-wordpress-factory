// Download exact Figma node structure through REST when interactive MCP OAuth
// is unavailable. The token stays in the process environment and is never
// written to disk or stdout.
const fs = require('fs');
const path = require('path');
const { ROOT, SNAPSHOT, read, write, inside, hash } = require('./common');
const { extractFigmaFileKey } = require('../figma/utils');

function options(args) {
  const value = {};
  for (let i = 0; i < args.length; i += 2) value[args[i]?.replace(/^--/, '')] = args[i + 1];
  return value;
}

async function main() {
  const opts = options(process.argv.slice(2));
  if (!process.env.FIGMA_TOKEN) throw Error('FIGMA_TOKEN unavailable; authenticated source recovery cannot continue.');
  const nodes = (opts.nodes || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!nodes.length || !opts.output) throw Error('Usage: --nodes <node-id,node-id> --output <snapshot-relative-json>');
  if (!opts.output.endsWith('.json')) throw Error('Output must be a snapshot-relative JSON file.');
  const fileKey = extractFigmaFileKey(read(path.join(ROOT, 'factory/project.json')).figma.url);
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodes.join(','))}&geometry=paths`, {
    headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN }, signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw Error(`FIGMA_HTTP_${response.status}; retry-after=${response.headers.get('retry-after') || 'not supplied'}`);
  const payload = await response.json();
  const missing = nodes.filter(id => !payload.nodes?.[id]?.document);
  if (missing.length) throw Error(`FIGMA_NODES_MISSING: ${missing.join(',')}`);
  const target = inside(SNAPSHOT, opts.output);
  const bytes = Buffer.from(JSON.stringify(payload, null, 2));
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  const provenance = { fileKey, nodeIds: nodes, path: opts.output, capturedAt: new Date().toISOString(), sha256: hash(bytes), transport: 'figma-rest-nodes' };
  write(`${target}.source.json`, provenance);
  console.log(JSON.stringify(provenance));
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
