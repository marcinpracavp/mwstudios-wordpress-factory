const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const snapshot = path.join(root, '.factory-cache', 'figma', 'latest');
const run = path.join(root, '.factory-cache', 'autopilot', 'runs', '2026-09-10T19-06-21-844Z-22492', '021-discovery-detail-account');
const assetDir = path.join(snapshot, 'assets', 'account');
const refDir = path.join(snapshot, 'references', 'sections');
const now = new Date().toISOString();
const source = { fileKey: 'OwiDXrKMVcaHKB9ryYF6mY', pageId: '0:1' };

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function copy(sourceFile, targetFile) { fs.mkdirSync(path.dirname(targetFile), { recursive: true }); fs.copyFileSync(sourceFile, targetFile); }
function hash(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
async function download(url, file, nodeId, usage) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Asset download failed for ${nodeId}: ${response.status}`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  const provenance = { ...source, nodeId, path: path.relative(snapshot, file).split(path.sep).join('/'), usage, transport: 'figma-mcp-design-context-asset', capturedAt: now, sha256: hash(file) };
  writeJson(`${file}.source.json`, provenance);
  return { sourceNodeId: nodeId, path: provenance.path, usage, sha256: provenance.sha256 };
}
function addField(map, field) {
  const index = map.fields.findIndex((entry) => entry.fieldName === field.fieldName);
  if (index === -1) map.fields.push(field); else map.fields[index] = field;
}
function ref(sectionId, crop) {
  const file = path.join(refDir, `${sectionId}.png`);
  copy(path.join(root, '.factory-cache', 'autopilot', 'previews', `${sectionId}-source.png`), file);
  writeJson(`${file}.source.json`, { ...source, nodeId: '524:2', path: `references/sections/${sectionId}.png`, crop, sourceReference: 'references/full/frame-524-2.png', scale: 1, transport: 'unscaled-1x-crop', capturedAt: now, sha256: hash(file) });
}
function sectionPath(section) { return `sections/${section.order}-${section.id}.json`; }
function upsertSection(manifest, section) {
  const existing = manifest.sections.findIndex((entry) => entry.id === section.id);
  const record = { id: section.id, name: section.name, order: section.order, pageId: section.source.pageId, desktopNodeId: section.source.desktopNodeId, snapshot: sectionPath(section), desktopReference: `references/sections/${section.id}.png` };
  if (existing === -1) manifest.sections.push(record); else manifest.sections[existing] = record;
  writeJson(path.join(snapshot, sectionPath(section)), section);
}
function addFrame(manifest, nodeId, name, type) {
  if (!Array.isArray(manifest.frames)) manifest.frames = [];
  const index = manifest.frames.findIndex((frame) => frame.nodeId === nodeId);
  const record = { nodeId, name, pageId: source.pageId, type, viewport: 'desktop', language: 'pl' };
  if (index === -1) manifest.frames.push(record); else manifest.frames[index] = record;
}
function notePlan() {
  const plan = path.join(root, 'docs', 'factory', 'project', 'PLAN.md');
  const heading = '## Account — sourced editable structure';
  const block = `${heading}\n\n| Section tab | Field name | Type | Return/value | Location |\n| --- | --- | --- | --- | --- |\n| Breadcrumb | \`rudnikagro_account_breadcrumb\` | Repeater (label, current) | sourced labels/boolean | ACF Options / Account content tab |\n| Login labels | \`rudnikagro_account_login_labels\` | Group (title, email_label, password_label, remember_label, submit_label, reset_label) | strings | ACF Options / Account content tab |\n| Registration labels | \`rudnikagro_account_registration\` | Group (title, benefits WYSIWYG, submit_label) | string, sourced HTML, string | ACF Options / Account content tab |\n| Native commerce | account authentication, registration and password recovery | WooCommerce native data/actions | dynamic; no copied credentials | WooCommerce account template |\n\nThe account labels are visible Figma source copy. Breadcrumb, password-reset and registration destinations were not captured as Figma hyperlinks/reactions; use native local WooCommerce/WordPress behavior during implementation without claiming those URLs are source facts.\n`;
  const content = fs.readFileSync(plan, 'utf8');
  if (!content.includes(heading)) fs.appendFileSync(plan, `\n${block}`);
}
function noteClarification() {
  const file = path.join(root, 'docs', 'factory', 'project', 'SOURCE_CLARIFICATIONS.md');
  const marker = '## Account discovery gaps';
  const block = `${marker}\n\n- Account frame \`524:2\` supplies visible breadcrumb, password-reset and registration labels but no Figma hyperlink or reaction for their destinations. Implementation may bind local WordPress/WooCommerce routes and native actions; those destinations are not captured Figma facts.\n`;
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(marker)) fs.appendFileSync(file, `\n${block}`);
}
async function main() {
  const manifestFile = path.join(snapshot, 'manifest.json');
  const contentFile = path.join(snapshot, 'content-map.json');
  const manifest = readJson(manifestFile);
  const content = readJson(contentFile);
  const loginAsset = await download('https://www.figma.com/api/mcp/asset/46eb4d44-5f33-40f5-8b8e-a5b5775a1963.svg', path.join(assetDir, 'account-login-panel.svg'), '524:196', 'login panel surface');
  const registrationAsset = await download('https://www.figma.com/api/mcp/asset/5f65ac7c-ce0e-4843-b86e-b8c382822fc0.svg', path.join(assetDir, 'account-registration-panel.svg'), '524:244', 'registration panel surface');
  ref('account-breadcrumbs', { x: 240, y: 189, width: 508, height: 70 });
  ref('account-login', { x: 240, y: 331, width: 710, height: 425 });
  ref('account-registration', { x: 970, y: 331, width: 709, height: 425 });
  const breadcrumbs = {
    id: 'account-breadcrumbs', name: 'breadcrumbs', order: 27,
    source: { pageId: source.pageId, desktopNodeId: '524:3' },
    desktop: { frameWidth: 1920, x: 240, y: 189, width: 508, height: 70 },
    layout: { type: 'breadcrumb', subnodes: [{ nodeId: '524:3', type: 'TEXT', visible: true, geometry: { x: 240, y: 189, width: 508, height: 70 } }], designContextRead: true },
    typography: [{ nodeId: '524:3', value: 'Strona główna  /  Logowanie/rejestracja', geometry: { x: 240, y: 189, width: 508, height: 70 }, segments: [
      { characters: 'Strona główna  /  ', start: 0, end: 18, fontSize: 14, fontName: { family: 'DM Sans', style: 'Regular', variationSettings: { wght: 400, opsz: 14 } }, fontWeight: 400, lineHeight: { unit: 'PIXELS', value: 34 }, letterSpacing: { unit: 'PERCENT', value: 0 }, fills: [{ type: 'SOLID', color: { r: 0.6666666667, g: 0.6666666667, b: 0.6666666667 } }], hyperlink: null },
      { characters: 'Logowanie/rejestracja', start: 18, end: 39, fontSize: 14, fontName: { family: 'DM Sans', style: 'Regular', variationSettings: { wght: 400, opsz: 14 } }, fontWeight: 400, lineHeight: { unit: 'PIXELS', value: 34 }, letterSpacing: { unit: 'PERCENT', value: 0 }, fills: [{ type: 'SOLID', color: { r: 0, g: 0.4, b: 0.2 } }], hyperlink: null }
    ] }], assets: [], notes: ['No Figma hyperlink or reaction was captured for either breadcrumb destination.'], liveFigmaRequired: false
  };
  const registration = {
    id: 'account-registration', name: 'rejestracja', order: 28,
    source: { pageId: source.pageId, desktopNodeId: '524:243' },
    desktop: { frameWidth: 1920, x: 970, y: 331, width: 709, height: 425 },
    layout: { type: 'native-commerce', subnodes: [
      { nodeId: '524:244', type: 'VECTOR', visible: true, geometry: { x: 970, y: 331, width: 709, height: 425 } },
      { nodeId: '524:245', type: 'TEXT', visible: true, geometry: { x: 998.2021484375, y: 376, width: 188.2299041748047, height: 38 } },
      { nodeId: '524:246', type: 'TEXT', visible: true, geometry: { x: 998, y: 420, width: 632, height: 192 } },
      { nodeId: '524:247', type: 'GROUP', visible: true, geometry: { x: 998.2021484375, y: 655, width: 144.94358825683594, height: 44 } }
    ], designContextRead: true },
    typography: [
      { nodeId: '524:245', value: 'Zarejestruj się', geometry: { x: 998.2021484375, y: 376, width: 188.2299041748047, height: 38 }, segments: [{ characters: 'Zarejestruj się', fontSize: 24, fontName: { family: 'DM Sans', style: 'Bold', variationSettings: { wght: 700, opsz: 14 } }, fontWeight: 700, lineHeight: { unit: 'AUTO' }, fills: [{ type: 'SOLID', color: { r: 0.0274509804, g: 0.0274509804, b: 0.0274509804 } }], hyperlink: null }] },
      { nodeId: '524:246', value: 'Otrzymasz liczne dodatkowe korzyści:\npodgląd statusu realizacji zamówień\npodgląd historii zakupów\nbrak konieczności wprowadzania swoich danych przy kolejnych zakupach\nmożliwość otrzymania rabatów i kuponów promocyjnych', geometry: { x: 998, y: 420, width: 632, height: 192 }, segments: [{ characters: 'Otrzymasz liczne dodatkowe korzyści:', fontSize: 16, fontName: { family: 'DM Sans', style: 'Bold', variationSettings: { wght: 700, opsz: 14 } }, fontWeight: 700, lineHeight: { unit: 'AUTO' }, fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] }, { characters: 'podgląd statusu realizacji zamówień\npodgląd historii zakupów\nbrak konieczności wprowadzania swoich danych przy kolejnych zakupach\nmożliwość otrzymania rabatów i kuponów promocyjnych', fontSize: 16, fontName: { family: 'DM Sans', style: 'Regular', variationSettings: { wght: 400, opsz: 14 } }, fontWeight: 400, lineHeight: { unit: 'PIXELS', value: 28 }, fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] }], hyperlink: null },
      { nodeId: '524:249', value: 'Zarejestruj się', geometry: { x: 999.001953125, y: 655, width: 144.14279174804688, height: 44 }, segments: [{ characters: 'Zarejestruj się', fontSize: 16, fontName: { family: 'DM Sans', style: 'Bold', variationSettings: { wght: 700, opsz: 14 } }, fontWeight: 700, lineHeight: { unit: 'AUTO' }, fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }], hyperlink: null }] }
    ], assets: [registrationAsset], notes: ['Native WooCommerce registration state. No Figma hyperlink or reaction was captured for the registration action.'], liveFigmaRequired: false
  };
  const loginFile = path.join(snapshot, 'sections', '13-account-login.json');
  const login = readJson(loginFile);
  login.assets = [loginAsset];
  login.notes = ['Native WooCommerce login state; password-reset destination was not captured as a Figma hyperlink or reaction.', 'Figma MCP design context and actual panel SVG bytes are preserved for offline implementation.'];
  login.liveFigmaRequired = false;
  writeJson(loginFile, login);
  upsertSection(manifest, breadcrumbs); upsertSection(manifest, registration);
  addFrame(manifest, '524:3', 'Strona główna / Logowanie/rejestracja', 'TEXT'); addFrame(manifest, '524:195', 'logowanie', 'FRAME'); addFrame(manifest, '524:243', 'logowanie', 'FRAME');
  const page = manifest.routes.find((entry) => entry.id === 'account');
  if (!page) throw new Error('Account route is missing from manifest');
  page.sectionGeometry = { ...(page.sectionGeometry || {}), 'account-breadcrumbs': breadcrumbs.desktop, 'account-login': login.desktop, 'account-registration': registration.desktop };
  writeJson(manifestFile, manifest);
  addField(content, { section: 'account-breadcrumbs', nodeId: '524:3', fieldName: 'rudnikagro_account_breadcrumb', type: 'repeater', language: 'pl', value: [{ label: 'Strona główna', current: false }, { label: 'Logowanie/rejestracja', current: true }], destination: 'Native WordPress breadcrumb; editable labels only', linkEvidence: [{ characters: 'Strona główna', hyperlink: null }, { characters: 'Logowanie/rejestracja', hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: '524:3' } });
  addField(content, { section: 'account-registration', nodeId: '524:245', fieldName: 'rudnikagro_account_registration_title', type: 'text', language: 'pl', value: 'Zarejestruj się', destination: 'Native WooCommerce registration; editable display label', linkEvidence: [{ characters: 'Zarejestruj się', hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: '524:245' } });
  addField(content, { section: 'account-registration', nodeId: '524:246', fieldName: 'rudnikagro_account_registration_benefits', type: 'wysiwyg', language: 'pl', value: '<p>Otrzymasz liczne dodatkowe korzyści:</p><ul><li>podgląd statusu realizacji zamówień</li><li>podgląd historii zakupów</li><li>brak konieczności wprowadzania swoich danych przy kolejnych zakupach</li><li>możliwość otrzymania rabatów i kuponów promocyjnych</li></ul>', destination: 'Native WooCommerce registration; editable display content', linkEvidence: [{ characters: 'Otrzymasz liczne dodatkowe korzyści: podgląd statusu realizacji zamówień podgląd historii zakupów brak konieczności wprowadzania swoich danych przy kolejnych zakupach możliwość otrzymania rabatów i kuponów promocyjnych', hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: '524:246' } });
  addField(content, { section: 'account-registration', nodeId: '524:249', fieldName: 'rudnikagro_account_registration_submit_label', type: 'text', language: 'pl', value: 'Zarejestruj się', destination: 'Native WooCommerce registration; editable display label', linkEvidence: [{ characters: 'Zarejestruj się', hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: '524:249' } });
  writeJson(contentFile, content);
  notePlan(); noteClarification();
  console.log(JSON.stringify({ sections: ['account-breadcrumbs', 'account-login', 'account-registration'], assets: [loginAsset.path, registrationAsset.path], references: ['references/sections/account-breadcrumbs.png', 'references/sections/account-login.png', 'references/sections/account-registration.png'], contentFieldsAdded: 4 }));
}
main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
