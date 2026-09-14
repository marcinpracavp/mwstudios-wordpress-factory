const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../../..');
const snapshot = path.join(root, '.factory-cache/figma/latest');
const manifestPath = path.join(snapshot, 'manifest.json');
const contentPath = path.join(snapshot, 'content-map.json');
const refDir = path.join(snapshot, 'references/sections');
const sectionDir = path.join(snapshot, 'sections');
const previewDir = path.join(root, '.factory-cache/autopilot/previews');
const assetDir = path.join(snapshot, 'assets/about');

function copyPreview(id) {
  const source = path.join(previewDir, `${id}.png`);
  const target = path.join(refDir, `${id}.png`);
  if (!fs.existsSync(source)) throw new Error(`Missing exact source crop: ${source}`);
  fs.copyFileSync(source, target);
  return path.relative(snapshot, target).replaceAll('\\', '/');
}

for (const dir of [refDir, sectionDir, assetDir]) fs.mkdirSync(dir, { recursive: true });
const references = Object.fromEntries(['about-heading', 'about-introduction', 'about-agricultural-supply', 'about-grain-trade', 'about-insurance'].map(id => [id, copyPreview(id)]));

const sections = [
  {
    id: 'about-heading', name: 'About page banner and breadcrumb', order: 34,
    source: { pageId: '0:1', desktopNodeId: '326:2977' },
    desktop: { frameWidth: 1920, x: 240, y: 218, width: 1440, height: 220, containerWidth: 1440, padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: null },
    layout: { type: 'banner-with-breadcrumb', alignment: 'center' },
    typography: [{ nodeId: '326:2984', family: 'DM Sans', style: 'Bold', fontSize: 48, lineHeight: 24, color: '#ffffff' }, { nodeId: '326:2765', family: 'DM Sans', style: 'Regular', fontSize: 16 }],
    colors: [{ nodeId: '326:2977', cornerRadius: 30 }], effects: [],
    contentFields: ['rudnikagro_about.banner.title', 'rudnikagro_about.breadcrumb'],
    assets: [{ sourceNodeId: '326:2977', path: 'assets/about/326-2977-about-banner.png', usage: 'Exact Figma banner image, rendered with the source 30px rounded corners.' }],
    notes: ['Desktop source only; mobile behavior must be derived.', 'Breadcrumb text is visible source content; route destinations are not captured hyperlinks.'], liveFigmaRequired: false
  },
  {
    id: 'about-introduction', name: 'About company introduction', order: 35,
    source: { pageId: '0:1', desktopNodeId: '326:2980' },
    desktop: { frameWidth: 1920, x: 240, y: 471, width: 1440, height: 337, containerWidth: 1196, padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 25 },
    layout: { type: 'centered-heading-and-rich-text', alignment: 'center' },
    typography: [{ nodeId: '326:2985', family: 'DM Sans', style: 'Bold', fontSize: 32, lineHeight: 24, color: '#000000' }, { nodeId: '326:2980', family: 'DM Sans', style: 'Regular/Bold', fontSize: 24, lineHeight: 'normal', color: '#000000' }],
    colors: [], effects: [], contentFields: ['rudnikagro_about.introduction.heading', 'rudnikagro_about.introduction.content'], assets: [],
    notes: ['The first introduction paragraph is bold and the second is regular in the source.', 'Desktop source only; mobile behavior must be derived.'], liveFigmaRequired: false
  },
  {
    id: 'about-agricultural-supply', name: 'Agricultural supply card', order: 36,
    source: { pageId: '0:1', desktopNodeId: '520:432' },
    desktop: { frameWidth: 1920, x: 160, y: 1397, width: 1600, height: 565, containerWidth: 1440, padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 20 },
    layout: { type: 'two-column-card-with-three-item-list', columns: [{ x: 240, width: 588 }, { x: 848, width: 832 }], alignment: 'center' },
    typography: [{ nodeId: '519:346', family: 'DM Sans', style: 'Bold', fontSize: 32, lineHeight: 24, color: '#000000' }, { nodeId: '519:345', family: 'DM Sans', style: 'Regular', fontSize: 24, lineHeight: 'normal', color: '#000000' }, { nodeId: '520:386', family: 'DM Sans', style: 'Bold', fontSize: 24, color: '#000000' }],
    colors: [{ nodeId: '520:432', sourceVector: true }, { nodeId: '519:348', cornerRadius: 30 }], effects: [{ nodeId: '519:348', shadow: '0px 4px 10px rgba(0,0,0,0.25)' }],
    contentFields: ['rudnikagro_about.supply.heading', 'rudnikagro_about.supply.introduction', 'rudnikagro_about.supply.items', 'rudnikagro_about.supply.image'],
    assets: [
      { sourceNodeId: '520:432', path: 'assets/about/520-432-supply-card.svg', usage: 'Exact source card background vector.' },
      { sourceNodeId: '519:348', path: 'assets/about/519-348-supply-photo.png', usage: 'Exact source card image with the recorded crop.' },
      { sourceNodeId: '520:364', path: 'assets/about/520-364-crop-protection.svg', usage: 'First sourced supply icon.' },
      { sourceNodeId: '520:366', path: 'assets/about/520-366-fertilizer.svg', usage: 'Second sourced supply icon.' },
      { sourceNodeId: '520:374', path: 'assets/about/520-374-seeds.svg', usage: 'Third sourced supply icon.' }
    ], notes: ['Desktop source only; mobile behavior must be derived.'], liveFigmaRequired: false
  },
  {
    id: 'about-grain-trade', name: 'Grain trade card', order: 37,
    source: { pageId: '0:1', desktopNodeId: '519:351' },
    desktop: { frameWidth: 1920, x: 160, y: 2085, width: 1600, height: 631, containerWidth: 1440, padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 20 },
    layout: { type: 'two-column-card-with-rich-text', columns: [{ x: 240, width: 832 }, { x: 1092, width: 588 }], alignment: 'center' },
    typography: [{ nodeId: '519:352', family: 'DM Sans', style: 'Bold', fontSize: 32, lineHeight: 24, color: '#000000' }, { nodeId: '519:351', family: 'DM Sans', style: 'Regular/Bold', fontSize: 24, lineHeight: 'normal', color: '#000000' }],
    colors: [{ nodeId: '521:452', sourceVector: true }, { nodeId: '519:350', cornerRadius: 30 }], effects: [{ nodeId: '519:350', shadow: '0px 4px 10px rgba(0,0,0,0.25)' }],
    contentFields: ['rudnikagro_about.grain_trade.heading', 'rudnikagro_about.grain_trade.content', 'rudnikagro_about.grain_trade.image'],
    assets: [{ sourceNodeId: '521:452', path: 'assets/about/521-452-grain-card.svg', usage: 'Exact source card background vector.' }, { sourceNodeId: '519:350', path: 'assets/about/519-350-grain-photo.png', usage: 'Exact source card image.' }],
    notes: ['Desktop source only; mobile behavior must be derived.'], liveFigmaRequired: false
  },
  {
    id: 'about-insurance', name: 'Agricultural insurance card', order: 38,
    source: { pageId: '0:1', desktopNodeId: '521:435' },
    desktop: { frameWidth: 1920, x: 160, y: 2837, width: 1600, height: 695, containerWidth: 1440, padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 20 },
    layout: { type: 'two-column-card-with-rich-text-and-contact', columns: [{ x: 240, width: 588 }, { x: 848, width: 832 }], alignment: 'center' },
    typography: [{ nodeId: '521:436', family: 'DM Sans', style: 'Bold', fontSize: 32, lineHeight: 24, color: '#000000' }, { nodeId: '521:435', family: 'DM Sans', style: 'Regular/Bold', fontSize: 24, lineHeight: 'normal', color: '#000000' }, { nodeId: '521:439', family: 'DM Sans', style: 'Regular/Bold', fontSize: 24, lineHeight: 'normal', color: '#ffffff' }],
    colors: [{ nodeId: '521:454', sourceVector: true }, { nodeId: '521:434', cornerRadius: 30 }], effects: [{ nodeId: '521:434', shadow: '0px 4px 10px rgba(0,0,0,0.25)' }],
    contentFields: ['rudnikagro_about.insurance.heading', 'rudnikagro_about.insurance.content', 'rudnikagro_about.insurance.expert'],
    assets: [{ sourceNodeId: '521:454', path: 'assets/about/521-454-insurance-card.svg', usage: 'Exact source card background vector.' }, { sourceNodeId: '521:434', path: 'assets/about/521-434-insurance-photo.png', usage: 'Exact source card image with the recorded crop.' }],
    notes: ['Expert contact is visible source content; no external mail or telephone action is asserted.', 'Desktop source only; mobile behavior must be derived.'], liveFigmaRequired: false
  }
];

for (const section of sections) {
  const snapshotPath = path.join(sectionDir, `${String(section.order).padStart(2, '0')}-${section.id}.json`);
  fs.writeFileSync(snapshotPath, `${JSON.stringify(section, null, 2)}\n`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const section of sections) {
  manifest.sections = manifest.sections.filter(entry => entry.id !== section.id);
  manifest.sections.push({ id: section.id, order: section.order, snapshot: `sections/${String(section.order).padStart(2, '0')}-${section.id}.json`, desktopReference: references[section.id] });
}
const route = manifest.routes.find(entry => entry.id === 'about');
if (!route) throw new Error('About route missing');
route.sectionGeometry = { ...(route.sectionGeometry || {}) };
for (const section of sections) route.sectionGeometry[section.id] = { x: section.desktop.x, y: section.desktop.y, width: section.desktop.width, height: section.desktop.height };
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const fields = [
  ['about-heading', '326:2984', 'rudnikagro_about.banner.title', 'text', 'O nas'],
  ['about-heading', '326:2765', 'rudnikagro_about.breadcrumb', 'repeater', [{ label: 'Strona główna' }, { label: 'O nas' }]],
  ['about-heading', '326:2977', 'rudnikagro_about.banner.image', 'image', 'assets/about/326-2977-about-banner.png'],
  ['about-introduction', '326:2985', 'rudnikagro_about.introduction.heading', 'text', 'Poznaj nas'],
  ['about-introduction', '326:2980', 'rudnikagro_about.introduction.content', 'wysiwyg', '<p><strong>Rudnikagro Sp. z o.o. oferuje kompleksowe wsparcie rolnictwa oraz zapewnia najwyższy standard obsługi. Od siedemnastu lat jesteśmy stabilnym i wiarygodnym partnerem dla firm dystrybucyjnych oraz producentów rolnych.</strong></p><p>Dokładamy wszelkich starań, aby nasi Klienci w możliwie najkrótszym czasie mieli dostęp do najbardziej efektywnych rozwiązań agrotechnicznych. Chętnie dzielimy się wiedzą i doświadczeniem. Nasza oferta produktowa z biegiem czasu stale się powiększa, ponieważ w kompleksowy sposób zaspokajamy rosnące potrzeby i oczekiwania rynku.</p>'],
  ['about-agricultural-supply', '519:346', 'rudnikagro_about.supply.heading', 'text', 'Kompleksowe zaopatrzenie rolnictwa'],
  ['about-agricultural-supply', '519:345', 'rudnikagro_about.supply.introduction', 'text', 'Nasza podstawowa działalność opiera się na wieloletnim doświadczeniu. Głównym filarem naszej oferty jest sprzedaż:'],
  ['about-agricultural-supply', '520:386', 'rudnikagro_about.supply.items.0.title', 'text', 'środków ochrony roślin'],
  ['about-agricultural-supply', '521:442', 'rudnikagro_about.supply.items.1.title', 'text', 'wysokiej jakości nawozów'],
  ['about-agricultural-supply', '521:444', 'rudnikagro_about.supply.items.2.title', 'text', 'wyselekcjonowanego materiału siewnego (nasion)'],
  ['about-grain-trade', '519:352', 'rudnikagro_about.grain_trade.heading', 'text', 'Skup i obrót płodami rolnymi'],
  ['about-grain-trade', '519:351', 'rudnikagro_about.grain_trade.content', 'wysiwyg', '<p>Od początku istnienia firmy przykładamy szczególną wagę do obrotu płodami rolnymi – zarówno na rynku krajowym, jak i europejskim. Współpracujemy z największymi odbiorcami zbóż i rzepaku. Posiadamy certyfikaty REDcert oraz GMP+, a także wyróżnienie Diamenty Forbesa.</p><ul><li><strong>Co skupujemy:</strong> Regularnie nabywamy m.in. pszenicę, pszenżyto, jęczmień, żyto, owies, kukurydzę, rzepak, łubin i inne surowce rolne.</li><li><strong>Logistyka:</strong> Zapewniamy sprawny odbiór i transport płodów rolnych przez cały rok.</li><li><strong>Korzyści dla rolnika:</strong> Oferujemy atrakcyjne ceny, terminowe rozliczenia oraz dogodną wymianę handlową (np. płody rolne w zamian za środki ochrony roślin czy nawozy).</li></ul>'],
  ['about-insurance', '521:436', 'rudnikagro_about.insurance.heading', 'text', 'Ubezpieczenia dla rolnictwa'],
  ['about-insurance', '521:435', 'rudnikagro_about.insurance.content', 'wysiwyg', '<ul><li><strong>Uprawy rolne:</strong> Do 65% dopłaty do składki z budżetu państwa (odpowiedzialność już od 8%). Ochrona przed: wymarznięciem, ogniem, przymrozkami wiosennymi, gradem, deszczem nawalnym, huraganem.</li><li><strong>Maszyny rolnicze:</strong> Bardzo szeroki zakres ochrony (w tym Agro Casco). Ubezpieczenia od wszystkich ryzyk (kradzież, zniszczenie, ogień i inne zdarzenia losowe). Dostępne umowy krótkoterminowe, roczne i wieloletnie.</li><li><strong>Budynki i OC:</strong> Ochrona majątku (budynki i budowle, silosy, magazyny płaskie, wagi najazdowe) od ognia i zdarzeń losowych. Zabezpieczenie towarów (ziemiopłodów) w magazynach oraz polisy OC dla przedsiębiorstw rolnych.</li></ul>'],
  ['about-insurance', '521:439', 'rudnikagro_about.insurance.expert', 'group', { role: 'Ekspert ds. Ubezpieczeń', name: 'Monika Zielińska', telephone: '532 402 999', email: 'mzielinska@madez.pl' }]
].map(([section, nodeId, fieldName, type, value]) => ({ section, nodeId, fieldName, type, language: 'pl', value }));
content.fields = content.fields.filter(field => !sections.some(section => section.id === field.section));
content.fields.push(...fields);
fs.writeFileSync(contentPath, `${JSON.stringify(content, null, 2)}\n`);
console.log(JSON.stringify({ sections: sections.map(s => s.id), fields: fields.length, references }, null, 2));
