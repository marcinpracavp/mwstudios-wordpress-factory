/** Publish compact evidence only after real captures and their hashes agree. */
const fs = require('fs');
const path = require('path');
const { verify, sha } = require('../../../../tools/live-capture/bundle');
const root = path.resolve(__dirname, '../../../..');
const cache = path.join(root, '.factory-cache/live/collegium-balticum/migration');
const docs = path.join(root, 'docs/projects/collegium-balticum');
const read = file => JSON.parse(fs.readFileSync(file));
const source = read(path.join(cache, 'source.json'));
const imported = read(path.join(cache, 'import-result.json'));
const renders = read(path.join(cache, 'qa/render.json'));
const comparisons = read(path.join(cache, 'comparisons/comparison.json'));
const interactions = read(path.join(cache, 'qa/interactions.json'));
const references = read(path.join(docs, 'capture-3c/references-evidence.json'));
const documents = read(path.join(cache, 'documents.json'));
const config = read(path.join(docs, 'live.json'));
const manifests = [...new Set(references.rows.flatMap(r => r.views.map(v => v.bundle)))].map(id => {
  const manifest = verify(path.join(root, '.factory-cache/live/collegium-balticum/imports', id), config);
  return { id, verifiedFiles: manifest.files.length };
});
if (renders.length !== 38 || comparisons.length !== 38 || source.pages.length !== 19) throw Error('Incomplete evidence');
for (const comparison of comparisons) {
  if (sha(fs.readFileSync(comparison.source)) !== comparison.sourceSha256 || sha(fs.readFileSync(comparison.local)) !== comparison.localSha256) throw Error('Stale comparison ' + comparison.id);
  for (const file of Object.values(comparison.paths)) if (!fs.statSync(file).size) throw Error('Empty comparison');
}
const templates = { 'CB-00': 'template-homepage.php', 'CB-01': 'template-contact.php', 'CB-02': 'archive.php (category)', 'CB-03': 'single.php (post)', 'CB-04': 'template-banner-tile.php', 'CB-05': 'template-banner-tile.php', 'CB-06': 'template-banner-accordion.php', 'CB-07': 'template-banner-accordion.php', 'CB-08': 'template-course.php', 'CB-11': 'template-course.php', 'CB-13': 'template-basic.php', 'CB-14': 'template-basic.php', 'CB-18': 'template-basic.php' };
const notes = {
  'CB-00': 'Pozycja początkowa banera zgodna z osobnymi referencjami desktop/mobile; bez autoplay.',
  'CB-01': 'Backend lokalny działa; brak wysyłki produkcyjnej. Mapa zewnętrzna nie była odtwarzana w automatycznej sesji.',
  'CB-02': 'Natywna kategoria i paginacja; pozostałe wpisy mają tylko autentyczne zajawki i odsyłają do źródła.',
  'CB-03': 'Pełna treść natywnego wpisu; pozostałe zajawki nie udają pełnych artykułów.',
  'CB-04': 'Zachowane cztery oryginalne iframe; odtwarzanie/captions wymagają osobnej kontroli.',
  'CB-05': 'Zachowane cztery iframe i zamknięte galerie zgodnie z DOM. Odtwarzanie/captions poza automatycznym QA.',
  'CB-08': 'Źródłowy pusty src pominięto; nie dodano zastępczego obrazu.',
  'CB-10': 'Lokalny filtr Szczecina działa; pozostałe miasta prowadzą do istniejącej usługi źródłowej.',
  'CB-11': 'Pominięto pusty źródłowy baner (272 px desktop / 125 px mobile); nie dodano zastępczego obrazu.',
  'CB-16': 'Usunięto źródłowy overflow mobilny około 5 px.',
  'CB-17': 'Naprawiono geometrię karuzeli desktop; zachowano znaną kolejność DOM bez zgadywania slajdów.',
  'CB-18': 'Naprawiono geometrię karuzeli desktop; galeria 4 kolumny desktop / 1 mobile.'
};
const rows = source.pages.map(page => {
  const render = renders.filter(r => r.id === page.id);
  const complete = render.length === 2 && render.every(r => r.status === 200 && !r.missingContent.length && !r.missingEmbeds.length);
  const docsForPage = documents.find(r => r.id === page.id).documents;
  return {
    id: page.id, sourceUrl: page.url, localUrl: imported.runtime.localUrl + page.path,
    wpId: imported.ids[page.id], recordType: page.id === 'CB-02' ? 'category term' : page.id === 'CB-03' ? 'post' : 'page',
    template: templates[page.id] || 'template-flexible.php', sourceCapture: 'DONE',
    sourceQuality: references.rows.find(r => r.id === page.id).views.map(v => ({ viewport: v.viewport, status: v.status, warnings: v.sourceWarnings })),
    templateStatus: 'DONE', localRender: 'DONE', content: complete ? 'DONE' : 'IN_PROGRESS',
    documentCount: docsForPage.length, images: render.every(r => !r.images.length) ? 'DONE' : 'BLOCKED', documents: docsForPage.some(d => d.localCopy !== 'DONE') ? 'BLOCKED' : 'DONE',
    desktopVisualQa: 'IN_PROGRESS', mobileVisualQa: 'IN_PROGRESS', wcagQa: 'IN_PROGRESS',
    functionality: 'IN_PROGRESS', openIssues: (notes[page.id] || 'Dalsze dopasowanie odstępów i typografii.') + (docsForPage.some(d => d.localCopy !== 'DONE') ? ` Brak ${docsForPage.filter(d => d.localCopy !== 'DONE').length} lokalnych kopii dokumentów; oryginalne linki zachowane.` : ''),
    sections: page.sections.length,
    views: comparisons.filter(r => r.id === page.id).map(c => ({ viewport: c.view, source: c.source, local: c.local, sourceSha256: c.sourceSha256, localSha256: c.localSha256, sourceSize: c.sourceSize, localSize: c.localSize, changedPixelRatio: c.ratio, comparisonFiles: c.paths }))
  };
});
const evidence = { at: new Date().toISOString(), branch: 'project/collegium-balticum', baseCommit: '4e283cf', runtime: imported.runtime, referenceManifests: manifests, importedMediaUrlMappings: imported.media, mappedMediaAttachments: imported.mediaAttachments, missingImages: imported.missing, localScreenshots: 38, comparisonImages: 114, responsiveChecks: 76, externalResourcesBlockedInAutomatedQa: ['YouTube iframe', 'Google Maps iframe'], rawPixelMetric: 'max channel delta > 32; full image, no rescaling or masking; not an acceptance threshold', interactions, rows };
evidence.componentChecks={};
for(const name of ['links','blog-seo','contrast']){const file=path.join(cache,'qa',name+'.json');if(fs.existsSync(file))evidence.componentChecks[name]=read(file);}
evidence.engineTestRuns=[];
for(const [command,file,fixtureOnly] of [['npm run factory:live:test','/tmp/cb4-live-tests.log',false],['npm run factory:autopilot:test','/tmp/cb4-autopilot-tests.log',false],['node --test scripts/projects/collegium-balticum/remote/capture.test.js','/tmp/cb4-client-tests.log',true]]){
  if(!fs.existsSync(file))continue;const text=fs.readFileSync(file,'utf8'),counts={};for(const match of text.matchAll(/# (tests|pass|fail) (\d+)/g))counts[match[1]]=Number(match[2]);evidence.engineTestRuns.push({command,fixtureOnly,observedAt:fs.statSync(file).mtime.toISOString(),logSha256:sha(Buffer.from(text)),...counts});
}
fs.writeFileSync(path.join(docs, 'TASK-4-EVIDENCE.json'), JSON.stringify(evidence, null, 2) + '\n');
const table = ['| ID | URL źródłowy | URL lokalny | WP ID | Szablon | Treść | Media | Desktop visual QA | Mobile visual QA | Funkcjonalność | Otwarte problemy |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...rows.map(r => `| ${r.id} | ${r.sourceUrl} | ${r.localUrl} | ${r.wpId}${r.recordType === 'category term' ? ' (term)' : ''} | ${r.template} | ${r.content} | obrazy ${r.images}; dokumenty ${r.documentCount ? r.documents : 'nie dotyczy (0 odnośników)'} | IN_PROGRESS | IN_PROGRESS | IN_PROGRESS | ${r.openIssues} |`)].join('\n');
fs.writeFileSync(path.join(docs, 'TASK-4-REGISTER.md'), '# Zadanie 4 — wszystkie 19 rzeczywistych widoków\n\n' + table + '\n\nCONTENT dotyczy kompletnej treści widoków zapisanych w referencjach, nie całej witryny ani treści pozostałych artykułów. DONE dla obrazów oznacza lokalną bibliotekę mediów i brak błędów ładowania; brakujące dokumenty opisano oddzielnie. Wykonano 38 rzeczywistych porównań, ale nie zatwierdzono zgodności 1:1 ani WCAG AA.\n');
const registry = ['| ID | SOURCE_CAPTURE | TEMPLATE | LOCAL_RENDER | CONTENT | VISUAL_QA | WCAG_QA |', '| --- | --- | --- | --- | --- | --- | --- |', ...rows.map(r => `| ${r.id} | DONE | DONE | DONE | ${r.content} | IN_PROGRESS | IN_PROGRESS |`)].join('\n');
const pagePath = path.join(docs, 'PAGES.md');
let pages = fs.readFileSync(pagePath, 'utf8').replace(/^<!-- TASK4_CURRENT -->[\s\S]*?<!-- TASK4_CURRENT_END -->\n\n/, '');
const current = '<!-- TASK4_CURRENT -->\n# Aktualny stan zadania 4\n\nWszystkie 19 adresów ma rzeczywiste lokalne dane WordPress; wcześniejsze sekcje tego dokumentu stanowią historię, nie bieżący status. Szczegóły URL, ID, szablonów i braków: [TASK-4-REGISTER](TASK-4-REGISTER.md), dowody: [TASK-4-EVIDENCE](TASK-4-EVIDENCE.json), raport: [TASK-4](TASK-4.md). SOURCE_CAPTURE=DONE oznacza pozyskanie referencji; 6 z 38 widoków nadal ma ostrzeżenia jakości źródła.\n\n' + registry + '\n\n<!-- TASK4_CURRENT_END -->\n\n';
fs.writeFileSync(pagePath, current + pages);
const visualRows = rows.flatMap(r => r.views.map(v => '\n| '+[r.id,v.viewport,v.sourceSize.join(' × '),v.localSize.join(' × '),(v.changedPixelRatio*100).toFixed(1)+'%','IN_PROGRESS'].join(' | ')+' |'));
fs.writeFileSync(path.join(docs, 'TASK-4-VISUAL.md'), '# Rzeczywiste porównania desktop/mobile — zadanie 4\n\n38 par zweryfikowanych hashami, pełne screenshoty bez skalowania i masek. Procent to surowa różnica pikseli, nie ocena zgodności ani próg akceptacji. Świadome odstępstwa obejmują usunięte klony Slick, panel poza viewportem i poprawioną geometrię źródła; nie wyjaśniają automatycznie wszystkich różnic. Do dopasowania/akceptacji pozostają odstępy, wysokości kart/sekcji, łamanie tekstu i stopka.\n\n| ID | Viewport | Źródło (px) | Lokalnie (px) | Surowy diff | Akceptacja visual QA |\n| --- | --- | --- | --- | --- | --- |'+visualRows.join('')+'\n\nPliki pair/overlay/diff: [TASK-4-EVIDENCE](TASK-4-EVIDENCE.json). Nie obniżono progów ani nie oznaczono VISUAL_QA=DONE.\n');
const documentRows = documents.flatMap(p => p.documents.map(d => '| '+[p.id,d.label.replace(/\|/g,'\\|'),d.url,d.localCopy].join(' | ')+' |'));
const blockedDocuments=documents.flatMap(p=>p.documents).filter(d=>d.localCopy!=='DONE').length;
fs.writeFileSync(path.join(docs, 'TASK-4-DOCUMENTS.md'), '# Dokumenty źródłowe — lokalne kopie i jawne braki\n\n43 wystąpienia odnośników, 37 unikalnych plików. Aktualnie '+blockedDocuments+' wystąpienia bez lokalnej kopii. Plików nie ma w artefaktach 3C; znany brak połączenia TCP Codespace z hostem CB opisano w 3B-0. Przygotowany workflow: .github/workflows/cb-documents.yml; sekwencyjny download wersjonowanej listy documents-source.json, walidacja sygnatur, manifest SHA256 i ZIP. Import: documents.js oraz documents-import.php. Opublikowanie workflow wymaga osobnej zgody na push. Zachowano oryginalne adresy, bez zastępczych dokumentów. Nie potwierdzono dostępności PDF/DOC/XLS/ZIP. Nie trzeba ponawiać capture stron ani robić screenshotów ręcznie.\n\n| ID | Tekst źródłowego odnośnika | Źródłowy plik | Lokalna kopia |\n| --- | --- | --- | --- |\n' + documentRows.join('\n') + '\n');
console.log('Verified 38 source/local pairs; reports generated. Visual acceptance remains IN_PROGRESS.');
