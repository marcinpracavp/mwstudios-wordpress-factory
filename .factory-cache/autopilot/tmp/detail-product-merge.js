const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const snapshot = path.join(root, '.factory-cache/figma/latest');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const manifestFile = path.join(snapshot, 'manifest.json');
const contentFile = path.join(snapshot, 'content-map.json');
const manifest = read(manifestFile);
const content = read(contentFile);
const ownership = sourceNodeId => ({ project: 'rudnikagro', sourceNodeId });
const textField = (section, nodeId, key, value, destination = 'WooCommerce product fields / product-detail ACF tab') => ({
  section, nodeId, fieldName: `rudnikagro_${section.replace(/-/g, '_')}_${key}_${nodeId.replace(':', '_')}`,
  type: 'text', language: 'pl', value, destination, linkEvidence: [{ characters: value, hyperlink: null }],
  importStatus: 'pending-native-content-verification', ownership: ownership(nodeId)
});
const existingNames = new Set(content.fields.map(field => field.fieldName));
const addFields = fields => fields.filter(field => !existingNames.has(field.fieldName)).forEach(field => { existingNames.add(field.fieldName); content.fields.push(field); });
const byId = new Map(manifest.sections.map(section => [section.id, section]));
let order = Math.max(...manifest.sections.map(section => section.order), 0);
const register = spec => {
  const jsonPath = `sections/${String(++order).padStart(2, '0')}-${spec.id}.json`;
  const entry = { id: spec.id, name: spec.name, order, pageId: '0:1', snapshot: jsonPath, desktopNodeId: spec.nodeId, desktopReference: spec.reference };
  const json = { id: spec.id, name: spec.name, order, source: { pageId: '0:1', desktopNodeId: spec.nodeId }, desktop: spec.desktop, layout: spec.layout, typography: spec.typography || [], assets: spec.assets || [], notes: spec.notes || [], liveFigmaRequired: false };
  if (byId.has(spec.id)) throw new Error(`Section already registered: ${spec.id}`);
  manifest.sections.push(entry); byId.set(spec.id, entry); write(path.join(snapshot, jsonPath), json); addFields(spec.fields || []);
};
const crumbs = (section, node) => [textField(section, node, 'trail', 'Strona główna / Środki ochrony Roślin / Herbicydy / Aquatos 5L', 'WooCommerce product breadcrumb labels')];
const tabLabels = (section, node) => ['Dane techniczne', 'Opis produktu', 'Stosowanie', 'Opinie', 'Pliki do pobrania'].map((value, index) => textField(section, node, `tab_${index + 1}`, value, 'WooCommerce product tabs / ACF tab labels'));
const technical = [
  ['roślina_chroniona', 'Roślina chroniona'],
  ['roślina_chroniona_treść', 'truskawka, cebula, marchew, groch jadalny zielony, czosnek, słonecznik, seler listkowy, kolendra siewna, pietruszka naciowa, szczypiorek, roszponka, kminek, zwyczajny, kozieradka pospolita'],
  ['substancja_czynna', 'Substancja czynna'],
  ['substancja_czynna_treść', 'pendimetalina (związek z grupy dinitroanilin) – 455 g/l (39%)'],
  ['zwalczana_choroba', 'Zwalczana choroba / szkodnik'],
  ['zwalczana_choroba_treść', 'Wrażliwe: chwastnica jednostronna, fiołek polny, fiolek trójbarwny, gwiazdnica pospolita, jasnota różowa, komosa biała, pokrzywa żegawka, przetacznik perski, rdest ptasi, rdest plamisty, rzodkiew świrzepa, rumian polny, tasznik pospolity, wiechlina roczna. Średniowrażliwe: bodziszek drobny, gorczyca polna, iglica pospolita, jasnota purpurowa, pokrzywa zwyczajna, poziewnik szorstki, przytulia czepna, rdestówka powojowata, rumianek pospolity, szarłat szorstki, tobołki polne. Odporne: maruna bezwonna, przymiotno kanadyjskie, starzec zwyczajny, szarota błotna, żółtlica drobnokwiatowa'],
  ['dawka', 'Dawka'], ['dawka_treść', '20-25 ml/100 m2']
];
const technicalFields = (section, node) => technical.map(([key, value]) => textField(section, node, key, value, 'WooCommerce product technical-data repeater'));
const benefits = (section, node) => ['Oryginalne produkty', 'Szybka dostawa', 'Korzystne ceny', 'Tańsze pakiety produktowe'].map((value, index) => textField(section, node, `benefit_${index + 1}`, value, 'Product benefits repeater'));
const related = (section, node) => [
  textField(section, node, 'heading', 'Produkty powiązane', 'WooCommerce related products'),
  textField(section, '326:2271', 'product_1_name', 'Stomp Aqua 455 CS 1L', 'WooCommerce related products'),
  textField(section, '326:2272', 'product_1_price', '45,99 zł', 'WooCommerce related products'),
  textField(section, '326:2289', 'product_2_name', 'Stomp Aqua 455 CS 5L', 'WooCommerce related products'),
  textField(section, '326:2290', 'product_2_price', '534,60 zł', 'WooCommerce related products')
];
const legalText = 'Środki ochrony roślin mogą być nabywane wyłącznie przez osoby pełnoletnie oraz posiadające kwalifikacje wymagane od osób nabywających środki ochrony roślin określone w art. 28. Ustawy z dnia 08.03.2013r. o środkach ochrony roślin (Dz.U.z 2019 poz.1900 z późn.zm.).\nZe środków ochrony roślin należy korzystać z zachowaniem bezpieczeństwa. Przed każdym użyciem przeczytaj informacje zamieszczone w etykiecie i informacje dotyczące produktu. Zwróć uwagę na zwroty wskazujące rodzaj zagrożenia oraz przestrzegaj środków bezpieczeństwa zamieszczonych w etykiecie.';
register({ id: 'product-breadcrumbs', name: 'breadcrumb produktu', nodeId: '318:1557', reference: 'references/sections/product-breadcrumbs.png', desktop: { frameWidth: 1920, x: 240, y: 189, width: 508, height: 70 }, layout: { type: 'breadcrumb' }, fields: crumbs('product-breadcrumbs', '318:1557') });
register({ id: 'product-gallery', name: 'galeria produktu', nodeId: '326:2218', reference: 'references/sections/product-gallery.png', desktop: { frameWidth: 1920, x: 240, y: 259, width: 710, height: 710 }, layout: { type: 'product-gallery', columns: [6, 6] }, assets: [{ sourceNodeId: '323:2091', path: 'assets/product-aquatos-5l.png', usage: 'Product gallery primary image' }], notes: ['Single visible primary product image; no source thumbnail interaction state was supplied.'] });
register({ id: 'product-tabs', name: 'zakładki produktu', nodeId: '319:2072', reference: 'references/sections/product-tabs.png', desktop: { frameWidth: 1920, x: 240, y: 1096, width: 1440, height: 494 }, layout: { type: 'product-tabs', alignment: 'technical-data active' }, fields: [...tabLabels('product-tabs', '319:2072'), ...technicalFields('product-tabs', '319:2072')] });
register({ id: 'product-related', name: 'produkty powiązane', nodeId: '326:2515', reference: 'references/sections/product-related.png', desktop: { frameWidth: 1920, x: 240, y: 1635, width: 710, height: 570 }, layout: { type: 'related-products', columns: [3, 3] }, fields: related('product-related', '326:2515') });
register({ id: 'product-legal-notices', name: 'noty prawne produktu', nodeId: '326:2516', reference: 'references/sections/product-legal-notices.png', desktop: { frameWidth: 1920, x: 240, y: 2263, width: 1440, height: 287 }, layout: { type: 'legal-notices', subnodes: [{ nodeId: '326:2516', x: 240, y: 2263, width: 1440, height: 149 }, { nodeId: '326:2518', x: 240, y: 2437, width: 1440, height: 113 }] }, fields: [textField('product-legal-notices', '326:2517', 'consumer_notice', legalText, 'WooCommerce product legal notices'), textField('product-legal-notices', '326:2519', 'professional_notice', 'PRODUKT PROFESJONALNY\nNumer wpisu do rejestru działalności regulowane: 32/62/3946\nProdukt może zakupić jedynie osoba pełnoletnia, która spełnia warunki określone w art. 28. ustawy z dnia 8 marca 2013 r. o środkach ochrony roślin.', 'WooCommerce product legal notices')] });
register({ id: 'product-benefits', name: 'korzyści produktu', nodeId: '548:150', reference: 'references/sections/product-benefits.png', desktop: { frameWidth: 1920, x: 970, y: 842, width: 479, height: 128 }, layout: { type: 'benefit-list', alignment: 'vertical' }, fields: benefits('product-benefits', '548:151') });
register({ id: 'product-inquiry-dialog', name: 'formularz zapytania o produkt', nodeId: '431:876', reference: 'references/sections/product-inquiry-dialog.png', desktop: { frameWidth: 1920, x: 970, y: 711, width: 467, height: 702 }, layout: { type: 'product-inquiry-dialog' }, fields: [textField('product-inquiry-dialog', '431:882', 'heading', 'Zapytaj o produkt', 'CF7 product inquiry form'), textField('product-inquiry-dialog', '431:883', 'name_label', 'Imię', 'CF7 product inquiry form'), textField('product-inquiry-dialog', '431:884', 'email_label', 'Adres e-mail*', 'CF7 product inquiry form'), textField('product-inquiry-dialog', '431:885', 'question_label', 'Pytanie*', 'CF7 product inquiry form'), textField('product-inquiry-dialog', '431:889', 'privacy_note', 'Odpowiedź zostanie wysłana na podany adres e-mail.\n* - Pole wymagane\nPodanie danych zawartych w formularzu jest dobrowolne, ale niezbędne do przetworzenia zapytania. Szczegóły związane z przetwarzaniem danych przez administratorów zawarte są w Polityce Prywatności.', 'CF7 product inquiry form'), textField('product-inquiry-dialog', '431:891', 'submit_label', 'Wyślij', 'CF7 product inquiry form')] });
register({ id: 'bundle-breadcrumbs', name: 'breadcrumb pakietu', nodeId: '586:1029', reference: 'references/sections/bundle-breadcrumbs.png', desktop: { frameWidth: 1920, x: 240, y: 189, width: 508, height: 70 }, layout: { type: 'breadcrumb' }, fields: crumbs('bundle-breadcrumbs', '586:1029') });
register({ id: 'bundle-gallery', name: 'galeria pakietu', nodeId: '586:1276', reference: 'references/sections/bundle-gallery.png', desktop: { frameWidth: 1920, x: 300, y: 367, width: 600, height: 493 }, layout: { type: 'product-gallery', columns: [6, 6] }, assets: [{ sourceNodeId: '586:1276', path: 'assets/product-bundle-rapeseed.png', usage: 'Bundle gallery primary image' }] });
register({ id: 'bundle-benefits', name: 'korzyści pakietu', nodeId: '586:1251', reference: 'references/sections/bundle-benefits.png', desktop: { frameWidth: 1920, x: 970, y: 1183, width: 479, height: 128 }, layout: { type: 'benefit-list', alignment: 'vertical' }, fields: benefits('bundle-benefits', '586:1252') });
register({ id: 'bundle-tabs', name: 'zakładki pakietu', nodeId: '586:1103', reference: 'references/sections/bundle-tabs.png', desktop: { frameWidth: 1920, x: 240, y: 1392, width: 1440, height: 494 }, layout: { type: 'product-tabs', alignment: 'technical-data active' }, fields: [...tabLabels('bundle-tabs', '586:1103'), ...technicalFields('bundle-tabs', '586:1103')] });
const complete = ['product-overview', 'product-expanded-description', 'product-inquiry-overview', 'product-reviews', 'product-files', 'product-bundle-overview'];
for (const id of complete) {
  const entry = byId.get(id); if (!entry) throw new Error(`Missing existing section ${id}`);
  const file = path.join(snapshot, entry.snapshot); const section = read(file); section.liveFigmaRequired = false;
  section.notes = [...new Set([...(section.notes || []), 'Visual source facts were reconfirmed against the assigned Figma node in detail-product discovery.'])];
  write(file, section);
}
const frameNodes = [
  ['318:1557', 'breadcrumb produktu', 'TEXT'], ['326:2218', 'zdjecie produktu', 'GROUP'], ['319:2072', 'szczegóły', 'GROUP'], ['326:2515', 'produkty powiązane', 'GROUP'], ['326:2516', 'noty prawne produktu', 'RECTANGLE'], ['548:150', 'szczegoly', 'GROUP'], ['431:876', 'popup', 'FRAME'], ['586:1029', 'breadcrumb pakietu', 'TEXT'], ['586:1276', 'paka 1', 'RECTANGLE'], ['586:1251', 'szczegoly', 'GROUP'], ['586:1103', 'szczegóły', 'FRAME']
];
const knownFrames = new Set(manifest.frames.map(frame => frame.nodeId));
for (const [nodeId, name, type] of frameNodes) if (!knownFrames.has(nodeId)) manifest.frames.push({ nodeId, name, pageId: '0:1', type, viewport: 'desktop', language: 'pl' });
const setGeometry = (routeId, values) => { const route = manifest.routes.find(item => item.id === routeId); if (!route) throw new Error(`Missing route ${routeId}`); route.sectionGeometry = { ...(route.sectionGeometry || {}), ...values }; };
setGeometry('product', {
  'product-breadcrumbs': { x: 240, y: 189, width: 508, height: 70 }, 'product-gallery': { x: 240, y: 259, width: 710, height: 710 }, 'product-benefits': { x: 970, y: 842, width: 479, height: 128 }, 'product-tabs': { x: 240, y: 1096, width: 1440, height: 494 }, 'product-related': { x: 240, y: 1635, width: 710, height: 570 }, 'product-legal-notices': { x: 240, y: 2263, width: 1440, height: 287 }
});
setGeometry('product-inquiry', { 'product-inquiry-dialog': { x: 970, y: 711, width: 467, height: 702 } });
setGeometry('product-bundle', {
  'bundle-breadcrumbs': { x: 240, y: 189, width: 508, height: 70 }, 'bundle-gallery': { x: 300, y: 367, width: 600, height: 493 }, 'bundle-benefits': { x: 970, y: 1183, width: 479, height: 128 }, 'bundle-tabs': { x: 240, y: 1392, width: 1440, height: 494 }
});
write(manifestFile, manifest); write(contentFile, content);
const clarificationFile = path.join(root, 'docs/factory/project/SOURCE_CLARIFICATIONS.md');
let clarifications = fs.readFileSync(clarificationFile, 'utf8');
const line = '- Product source gaps: Figma supplies no destination URL/file bytes for “Pobierz etykietę”; configure the downloadable label in WooCommerce/ACF. The bundle contains source placeholder text “Spark Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.” and requires editorial replacement only when approved. Bundle variation SKUs, stock, tax configuration and 4/10 ha prices are not evidenced.\n';
if (!clarifications.includes('Product source gaps: Figma supplies no destination URL/file bytes')) { clarifications += (clarifications.endsWith('\n') ? '' : '\n') + line; fs.writeFileSync(clarificationFile, clarifications); }
console.log(JSON.stringify({ addedSections: 11, addedContentFields: content.fields.length, updatedSections: complete, status: manifest.status }));
