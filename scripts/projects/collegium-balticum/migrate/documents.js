/** Supplementary original-file download on a network with CB access; no page capture. */
const fs = require('fs'), path = require('path');
const { manifest, verify, zip, unzip, sha } = require('../../../../tools/live-capture/bundle');
const config = require('../../../../docs/projects/collegium-balticum/live.json');
const source = require('../../../../docs/projects/collegium-balticum/documents-source.json');
const args = process.argv.slice(2), value = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
async function main() {
  if (args.includes('--import')) {
    const output = path.resolve(value('--output') || '.factory-cache/live/collegium-balticum/migration/documents-import');
    fs.mkdirSync(output, { recursive: true });
    const staging = fs.mkdtempSync(path.join(output, '.verify-'));
    try {
      unzip(value('--import'), staging);
      const m = verify(staging, config);
      if (m.kind !== 'cb-documents' || m.documentSourceHash !== sha(Buffer.from(JSON.stringify(source)))) throw Error('Wrong document provenance');
      const report = JSON.parse(fs.readFileSync(path.join(staging, 'documents.json')));
      if (report.length !== source.documents.length || new Set(report.map(r => r.url)).size !== report.length) throw Error('Incomplete URL manifest');
      for (const r of report) {
        if (!source.documents.some(d => d.url === r.url)) throw Error('Unknown source URL');
        if (r.status === 'DONE' && (!m.files.some(f => f.path === r.file) || sha(fs.readFileSync(path.join(staging, r.file))) !== r.sha256)) throw Error('Missing or changed document');
      }
      const destination = path.join(output, sha(fs.readFileSync(path.join(staging, 'manifest.json'))).slice(0, 16));
      if (fs.existsSync(destination)) { verify(destination, config); fs.rmSync(staging, { recursive: true }); }
      else fs.renameSync(staging, destination);
      const repository = path.resolve(__dirname, '../../../..');
      const relative = path.relative(repository, destination);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        fs.writeFileSync(path.join(repository, '.factory-cache/live/collegium-balticum/migration/documents-ready.json'), JSON.stringify({ bundle: relative, manifestSha256: sha(fs.readFileSync(path.join(destination, 'manifest.json'))) }));
      }
      console.log(destination);
      return;
    } catch (e) { fs.rmSync(staging, { recursive: true, force: true }); throw e; }
  }
  if (!args.includes('--download')) throw Error('Use --download --output DIR, or --import ZIP --output DIR');
  const output = path.resolve(value('--output') || '.factory-cache/live/collegium-balticum/migration/documents-download');
  if (fs.existsSync(output)) throw Error('Output already exists; use a new directory to preserve evidence');
  fs.mkdirSync(path.join(output, 'files'), { recursive: true });
  const allowedHosts = new Set(source.documents.map(d => new URL(d.url).hostname));
  const report = [];
  for (const item of source.documents) {
    const result = { ...item, status: 'BLOCKED', httpStatus: null, finalUrl: null, bytes: null, contentType: null, sha256: null };
    try {
      let url = item.url, response;
      for (let redirects = 0; redirects <= 5; redirects++) {
        if (new URL(url).protocol !== 'https:' || !allowedHosts.has(new URL(url).hostname)) throw Error('Unapproved redirect origin');
        response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
        if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
          url = new URL(response.headers.get('location'), url).href;
          if (redirects === 5) throw Error('Too many redirects');
        } else break;
      }
      result.httpStatus = response.status; result.finalUrl = url;
      result.contentType = response.headers.get('content-type');
      if (!response.ok) throw Error('HTTP ' + response.status);
      const length = Number(response.headers.get('content-length') || 0);
      if (length > 50 * 1024 * 1024) throw Error('Document too large');
      const chunks = []; let size = 0;
      for await (const chunk of response.body) { size += chunk.length; if (size > 50 * 1024 * 1024) throw Error('Document too large'); chunks.push(chunk); }
      const bytes = Buffer.concat(chunks), ext = path.extname(new URL(item.url).pathname).toLowerCase();
      const signature = bytes.subarray(0, 8).toString('hex');
      const valid = ext === '.pdf' ? bytes.subarray(0, 5).toString() === '%PDF-' : ['.zip', '.docx', '.xlsx'].includes(ext) ? signature.startsWith('504b') : ['.doc', '.xls'].includes(ext) && (signature.startsWith('d0cf11e0a1b11ae1') || signature.startsWith('504b'));
      if (!valid) throw Error('Unexpected document signature; HTML/verification pages are never references');
      const hash = sha(bytes), file = 'files/' + hash + ext;
      fs.writeFileSync(path.join(output, file), bytes);
      Object.assign(result, { status: 'DONE', file, sha256: hash, bytes: bytes.length, contentType: response.headers.get('content-type') });
    } catch (e) { result.error = e.message; }
    report.push(result); console.log(result.status, item.url, result.error || result.bytes);
    // Requests are sequential; no retries or concurrent traffic to production.
  }
  fs.writeFileSync(path.join(output, 'documents.json'), JSON.stringify(report, null, 2));
  manifest(output, { project: config.project, sourceUrl: config.sourceUrl, configHash: sha(Buffer.from(JSON.stringify(config))), documentSourceHash: sha(Buffer.from(JSON.stringify(source))), kind: 'cb-documents', records: [], runner: process.env.GITHUB_ACTIONS === 'true' ? { kind: 'github-actions', repository: process.env.GITHUB_REPOSITORY, runId: process.env.GITHUB_RUN_ID, commit: process.env.GITHUB_SHA } : { kind: 'standalone' }, status: report.every(r => r.status === 'DONE') ? 'DONE' : 'BLOCKED', at: new Date().toISOString() });
  zip(output, output + '.zip');
  if (report.some(r => r.status !== 'DONE')) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
