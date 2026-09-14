const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../../../../..');
const snapshot = path.join(root, '.factory-cache/figma/latest');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(snapshot, relative), 'utf8'));
const write = (relative, data) => fs.writeFileSync(path.join(snapshot, relative), `${JSON.stringify(data, null, 2)}\n`);
const sha = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(snapshot, relative))).digest('hex');

const assets = [
  ['347:1230', 'assets/catalogues/catalogues-heading-background.png', 'catalogues heading background image'],
  ['347:1236', 'assets/catalogues/catalogues-agriculture-background.png', 'agricultural catalogue card background image'],
  ['347:1237', 'assets/catalogues/catalogues-orchard-background.png', 'orchard catalogue card background image'],
  ['349:1262', 'assets/catalogues/catalogue-agriculture-cover.png', 'agricultural catalogue cover image'],
  ['349:1263', 'assets/catalogues/catalogue-orchard-cover.png', 'orchard catalogue cover image'],
].map(([sourceNodeId, pathName, usage]) => ({ sourceNodeId, path: pathName, usage, sha256: sha(pathName), transport: 'figma-mcp-asset-export' }));

for (const asset of assets) {
  fs.writeFileSync(path.join(snapshot, `${asset.path}.source.json`), `${JSON.stringify({
    fileKey: 'OwiDXrKMVcaHKB9ryYF6mY', sourceNodeId: asset.sourceNodeId, transport: asset.transport, sha256: asset.sha256,
  }, null, 2)}\n`);
}

const heading = {
  id: 'catalogues-heading', name: 'Katalogi heading and breadcrumb', order: 34,
  source: { pageId: '0:1', desktopNodeId: '347:1230' },
  desktop: { frameWidth: 1920, x: 240, y: 218, width: 1440, height: 220 },
  layout: { type: 'page-banner-with-breadcrumb', titleNodeId: '347:1231', breadcrumbNodeId: '347:1121', borderRadius: 30, imageFill: { scaleMode: 'FILL', sourceNodeId: '347:1230', imageTransform: [[1, 0, 0], [0, 1, 0]] } },
  typography: [
    { nodeId: '347:1231', text: 'Katalogi', family: 'DM Sans', style: 'Bold', fontSize: 48, lineHeight: 24, color: '#FFFFFF', align: 'center' },
    { nodeId: '347:1121', text: 'Strona główna  / Katalogi', runs: [{ value: 'Strona główna  / ', color: '#AAAAAA' }, { value: 'Katalogi', color: '#006633' }], family: 'DM Sans', style: 'Regular', fontSize: 14, lineHeight: 34 },
  ],
  colors: [{ nodeId: '347:1230', image: assets[0].path }], effects: [], contentFields: ['rudnikagro_page_banner.title', 'rudnikagro_page_banner.image'], assets: [assets[0]],
  notes: ['Only the final breadcrumb label is green. No click destination is captured in the source.'],
  liveFigmaRequired: false,
};
write('sections/34-catalogues-heading.json', heading);
fs.writeFileSync(path.join(snapshot, 'references/sections/catalogues-heading.png.source.json'), `${JSON.stringify({ fileKey: 'OwiDXrKMVcaHKB9ryYF6mY', frameNodeId: '347:1120', transport: 'lossless-1x-crop-of-original-figma-reference', source: 'references/full/frame-347-1120.png', sourceSha256: sha('references/full/frame-347-1120.png'), crop: { frameWidth: 1920, x: 240, y: 218, width: 1440, height: 220 }, sha256: sha('references/sections/catalogues-heading.png') }, null, 2)}\n`);

const downloads = read('sections/04-catalogues-downloads.json');
downloads.assets = assets.slice(1);
downloads.liveFigmaRequired = false;
downloads.layout.designContextReadFor = ['347:1236', '347:1237', '349:1262', '349:1263'];
downloads.layout.remainingContextNodes = [];
delete downloads.designContextReadFor;
delete downloads.remainingContextNodes;
downloads.notes = downloads.notes.filter((note) => !note.includes('still require local byte capture'));
if (!downloads.notes.some((note) => note.includes('Background and catalogue-cover source bytes'))) downloads.notes.push('Background and catalogue-cover source bytes were captured from Figma MCP assets. Icons remain represented in the exact section reference; their visible source geometry is retained.');
write('sections/04-catalogues-downloads.json', downloads);

const manifest = read('manifest.json');
if (!manifest.sections.some((section) => section.id === 'catalogues-heading')) manifest.sections.push({ id: 'catalogues-heading', name: 'Katalogi heading and breadcrumb', order: 34, pageId: '0:1', snapshot: 'sections/34-catalogues-heading.json', desktopNodeId: '347:1230', desktopReference: 'references/sections/catalogues-heading.png' });
manifest.sections.sort((a, b) => a.order - b.order);
const route = manifest.routes.find((item) => item.id === 'catalogues');
route.sectionGeometry = { ...(route.sectionGeometry || {}), 'catalogues-heading': heading.desktop, 'catalogues-downloads': { frameNodeId: '347:1120', x: 240, y: 466, width: 1444, height: 357 } };
write('manifest.json', manifest);

const content = read('content-map.json');
const generatedFields = new Set(['catalogues_heading_title', 'catalogues_breadcrumb', 'catalogue_agriculture_title', 'catalogue_agriculture_pdf_label', 'catalogue_agriculture_online_label', 'catalogue_orchard_title', 'catalogue_orchard_pdf_label', 'catalogue_orchard_online_label']);
content.fields = content.fields.filter((field) => !generatedFields.has(field.fieldName));
const records = [
  ['catalogues-heading', '347:1231', 'rudnikagro_catalogues_347_1231', 'text', 'Katalogi', 'ACF catalogues page / Banner tab / banner title'],
  ['catalogues-heading', '347:1121', 'rudnikagro_catalogues_347_1121', 'structured_text', [{ value: 'Strona główna  / ', color: '#AAAAAA' }, { value: 'Katalogi', color: '#006633' }], 'native breadcrumb / sourced presentation record'],
  ['catalogues-heading', '347:1230', 'rudnikagro_catalogues_media_347_1230', 'image', assets[0].path, 'ACF catalogues page / Banner tab / image attachment ID'],
  ['catalogues-downloads', '347:1236', 'rudnikagro_catalogues_media_347_1236', 'image', assets[1].path, 'ACF catalogues page / Catalogues tab / cards repeater / background attachment ID'],
  ['catalogues-downloads', '347:1237', 'rudnikagro_catalogues_media_347_1237', 'image', assets[2].path, 'ACF catalogues page / Catalogues tab / cards repeater / background attachment ID'],
  ['catalogues-downloads', '349:1262', 'rudnikagro_catalogues_media_349_1262', 'image', assets[3].path, 'ACF catalogues page / Catalogues tab / cards repeater / cover attachment ID'],
  ['catalogues-downloads', '349:1263', 'rudnikagro_catalogues_media_349_1263', 'image', assets[4].path, 'ACF catalogues page / Catalogues tab / cards repeater / cover attachment ID'],
].map(([section, nodeId, fieldName, type, value, destination]) => ({ section, nodeId, fieldName, type, language: 'pl', value, destination, ownership: { project: 'rudnikagro', sourceNodeId: nodeId } }));
for (const record of records) if (!content.fields.some((field) => field.section === record.section && field.fieldName === record.fieldName)) content.fields.push(record);
write('content-map.json', content);
