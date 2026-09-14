const fs = require('fs');
const path = require('path');

const root = process.cwd();
const snapshot = path.join(root, '.factory-cache/figma/latest');
const manifestPath = path.join(snapshot, 'manifest.json');
const contentPath = path.join(snapshot, 'content-map.json');
const sectionPath = path.join(snapshot, 'sections/59-checkout-payment.json');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const text = [
  ['492:712', 'payment_heading', 'Płatność'],
  ['492:692', 'przelewy24_label', 'Przelewy24'],
  ['492:740', 'przelewy24_bank_prompt', 'wybierz Twój Bank'],
  ['492:696', 'card_label', 'Karta płatnicza'],
  ['492:704', 'google_pay_label', 'Google Pay'],
  ['492:708', 'apple_pay_label', 'Apple Pay'],
  ['492:726', 'blik_label', 'BLIK'],
  ['492:728', 'bank_transfer_label', 'Przelew tradycyjny'],
  ['492:729', 'postal_code_label', 'Kod pocztowy*'],
  ['492:731', 'cash_on_delivery_label', 'Pobranie'],
  ['492:742', 'cash_on_delivery_surcharge', '+ 6,00 zł']
];
const assets = [
  ['492:690', 'assets/checkout/checkout-payment-card.svg', 'payment-card-background'],
  ['524:186', 'assets/checkout/checkout-google-pay.svg', 'google-pay-mark'],
  ['519:284', 'assets/checkout/checkout-blik-logo.png', 'blik-mark'],
  ['492:717', 'assets/checkout/checkout-radio.svg', 'unselected-payment-radio'],
  ['492:718', 'assets/checkout/checkout-radio-active.svg', 'selected-payment-radio'],
  ['519:342', 'assets/checkout/checkout-card.svg', 'payment-card-mark'],
  ['524:175', 'assets/checkout/checkout-apple-pay.svg', 'apple-pay-mark'],
  ['519:328', 'assets/checkout/checkout-bank-transfer.svg', 'bank-transfer-mark']
].map(([sourceNodeId, assetPath, usage]) => ({ sourceNodeId, path: assetPath, usage }));

const section = {
  id: 'checkout-payment', name: 'płatność', order: 59,
  source: { pageId: '0:1', desktopNodeId: '492:994' },
  desktop: { frameWidth: 1920, x: 240, y: 1215, width: 953, height: 648, containerWidth: 1440 },
  layout: {
    type: 'native-commerce-payment-methods', designContextRead: true,
    columns: [{ x: 308, width: 399, role: 'payment-method-list' }],
    alignment: 'left',
    controls: { rowHeight: 44, rowGap: 28, border: '#c8c8c8', borderRadius: 15, radioOuter: 17, radioInner: 11 }
  },
  typography: [
    { nodeId: '492:712', value: 'Płatność', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 24, color: '#070707' },
    { nodeIds: text.slice(1).map(([nodeId]) => nodeId), fontFamily: 'DM Sans', fontWeight: 400, fontSize: 16, color: '#000000' },
    { nodeIds: ['492:740', '492:742'], fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#006633', alignment: 'right' }
  ],
  assets,
  contentFields: text.map(([id, fieldName, value]) => ({ id, text: value, link: null })),
  notes: [
    'Payment method labels and provider marks are exact Figma source content only; their WooCommerce gateway configuration is a downstream configuration requirement.',
    'The source displays a selected Przelewy24 radio control and listed payment methods; no payment attempt was made.'
  ],
  liveFigmaRequired: false
};

const manifest = read(manifestPath);
manifest.sections = manifest.sections.filter(entry => entry.id !== section.id);
manifest.sections.push({ id: section.id, name: section.name, order: section.order, pageId: '0:1', snapshot: 'sections/59-checkout-payment.json', desktopNodeId: '492:994', desktopReference: 'references/sections/checkout-payment.png' });
for (const [nodeId, name, type] of [['492:994', 'płatność', 'GROUP'], ['492:690', 'Rectangle 150', 'VECTOR'], ['524:186', 'gp 1', 'FRAME'], ['519:284', 'blik_logo.png', 'RECTANGLE'], ['492:717', 'Ellipse 24', 'ELLIPSE'], ['492:718', 'Ellipse 25', 'ELLIPSE'], ['519:342', 'karta', 'GROUP'], ['524:175', 'ap 1', 'FRAME'], ['519:328', 'przelew', 'GROUP']]) {
  if (!manifest.frames.some(frame => frame.nodeId === nodeId)) manifest.frames.push({ nodeId, name, pageId: '0:1', type, viewport: 'desktop', language: 'pl' });
}
const content = read(contentPath);
content.fields = content.fields.filter(field => field.section !== section.id);
content.fields.push(...text.map(([nodeId, fieldName, value]) => ({ section: section.id, nodeId, fieldName: `rudnikagro_checkout_payment_${fieldName}`, type: 'text', language: 'pl', value, destination: 'WooCommerce native payment-method labels / editable checkout content', linkEvidence: [{ characters: value, hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: nodeId } })));
write(sectionPath, section);
write(manifestPath, manifest);
write(contentPath, content);
