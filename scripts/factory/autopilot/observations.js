// Persist only structured source facts returned by successful read-only Figma calls.
// Never persist an MCP envelope, generated UI code, raw XML or inline image/base64 payloads.
const fs = require('fs');
const path = require('path');
const { SNAPSHOT, hash, read, write, jsonlLines } = require('./common');
function saveObservation(event) {
  const item = event.item;
  if (event.type !== 'item.completed' || item?.type !== 'mcp_tool_call' || item.error || item.result?.isError) return;
  if (!/(?:^|[._])use_figma$/.test(item.tool || '')) return;
  const facts = [];
  for (const block of item.result?.content || []) {
    if (block.type !== 'text') continue;
    try {
      const parsed = JSON.parse(block.text);
      if (parsed && typeof parsed === 'object' && !/data:image|base64/.test(block.text)) facts.push(parsed);
    } catch { /* Human hints and code are not structured source facts. */ }
  }
  if (!facts.length) return;
  const args = item.arguments || {};
  const id = hash(JSON.stringify({ tool: item.tool, args })).slice(0, 20);
  const dir = path.join(SNAPSHOT, 'observations');
  const target = path.join(dir, `${id}.json`);
  if (fs.existsSync(target)) return;
  const nodeIds = [...new Set(Array.from((args.code || '').matchAll(/getNodeByIdAsync\(['"]([^'"]+)['"]\)/g), m => m[1]))];
  const entry = { id, tool: item.tool, fileKey: args.fileKey || null, nodeIds, description: args.description || '',
    recordedAt: new Date().toISOString(), source: 'successful-worker-tool-event', facts };
  write(target, entry);
  const indexFile = path.join(dir, 'index.json');
  const index = fs.existsSync(indexFile) ? read(indexFile) : [];
  index.push({ id, nodeIds, description: entry.description, path: `observations/${id}.json` });
  write(indexFile, index);
}
async function recover(file) {
  if (!fs.existsSync(file)) return;
  const lines = jsonlLines(file);
  let lineNumber = 0;
  const rejected = [];
  for await (const line of lines) {
    lineNumber++;
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); }
    catch(e) { rejected.push({ line: lineNumber, bytes: Buffer.byteLength(line), sha256: hash(line), error: e.message }); continue; }
    saveObservation(event);
  }
  const result = { file, lines: lineNumber, rejected };
  write(`${file}.recovery.json`, result);
  return result;
}
if (require.main === module) recover(process.argv[2]).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { saveObservation, recover };
