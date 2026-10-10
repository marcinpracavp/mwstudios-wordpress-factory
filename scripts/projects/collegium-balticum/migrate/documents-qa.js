/** Verify original bytes, actual WordPress attachments and every captured document link. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { sha, verify } = require('../../../../tools/live-capture/bundle');
const root = path.resolve(__dirname, '../../../..');
const cache = path.join(root, '.factory-cache/live/collegium-balticum/migration');
const read = file => JSON.parse(fs.readFileSync(file));
async function main() {
  const pointer = read(path.join(cache, 'documents-ready.json'));
  const bundle = path.join(root, pointer.bundle);
  const manifest = verify(bundle, require('../../../../docs/projects/collegium-balticum/live.json'));
  if (sha(fs.readFileSync(path.join(bundle, 'manifest.json'))) !== pointer.manifestSha256) throw Error('Changed manifest');
  const original = read(path.join(bundle, 'documents.json'));
  const result = spawnSync('docker', ['compose', '-p', 'factory-live-qa', '-f', '.devcontainer/docker-compose.yml', 'exec', '-T', 'wpcli', 'wp', 'eval-file', '/var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/documents-qa.php'], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw Error('WordPress document query failed: ' + result.stderr);
  const wordpress = JSON.parse(result.stdout), checks = [];
  for (const source of original) {
    const asset = wordpress.rows.find(row => row.sourceUrl === source.url);
    if (source.status !== 'DONE' || !asset || asset.postType !== 'attachment' || !asset.exists || asset.sha256 !== source.sha256 || asset.bytes !== source.bytes) throw Error('Missing/changed attachment: ' + source.url);
    if (new URL(asset.url).origin !== 'http://localhost:8000') throw Error('Wrong attachment origin');
    const response = await fetch(asset.url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    const row = { sourceUrl: source.url, attachmentId: asset.id, localUrl: asset.url, httpStatus: response.status, mime: response.headers.get('content-type'), bytes: bytes.length, sha256: sha(bytes) };
    if (response.status !== 200 || row.sha256 !== source.sha256 || row.bytes !== source.bytes) throw Error('Document HTTP integrity mismatch: ' + source.url);
    checks.push(row);
  }
  const pages = read(path.join(cache, 'source.json')).pages;
  const documents = read(path.join(cache, 'documents.json'));
  const links = [];
  for (const page of pages) {
    const response = await fetch('http://localhost:8000' + page.path, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    const html = await response.text(), entries = documents.find(row => row.id === page.id).documents;
    for (const document of entries) {
      const asset = wordpress.rows.find(row => row.sourceUrl === document.url);
      if (!asset || !html.includes('href="' + asset.url.replace(/&/g, '&amp;') + '"') || html.includes('href="' + document.url + '"')) throw Error('Unmapped document link: ' + page.id + ' ' + document.url);
    }
    if (response.status !== 200) throw Error('Page HTTP ' + response.status + ': ' + page.id);
    links.push({ id: page.id, status: response.status, documentOccurrences: entries.length, missing: 0 });
  }
  const evidence = { at: new Date().toISOString(), runner: manifest.runner, manifestSha256: pointer.manifestSha256, documents: checks, uniqueAttachmentIds: new Set(checks.map(row => row.attachmentId)).size, links, counts: wordpress.counts };
  fs.writeFileSync(path.join(cache, 'qa/documents.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ documents: checks.length, uniqueAttachments: evidence.uniqueAttachmentIds, links: links.reduce((n, row) => n + row.documentOccurrences, 0), pages: links.length, counts: wordpress.counts }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
