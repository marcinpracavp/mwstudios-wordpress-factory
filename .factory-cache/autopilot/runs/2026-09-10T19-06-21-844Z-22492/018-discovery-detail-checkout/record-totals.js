const fs = require('fs'); const path = require('path'); const snapshot = path.join(process.cwd(), '.factory-cache/figma/latest');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8')); const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const text = [
  ['509:211', 'coupon_prompt', 'Masz kod rabatowy?'], ['509:209', 'coupon_placeholder', 'Wpisz kod'], ['509:207', 'coupon_submit_label', 'Dodaj kod'], ['509:210', 'summary_heading', 'Podsumowanie'],
  ['509:212', 'summary_labels', 'Produkty\n\nWysyłka\n\nRabat\nDodano kod BLACKFRIDAY'], ['509:213', 'summary_amounts', '411,00 zł\n\n22,90 zł\n\n50 zł'], ['509:214', 'total_label', 'Do zapłaty'], ['509:215', 'total_amount', '383,90 zł'], ['509:217', 'place_order_label', 'Realizuj zamówienie']
];
const section = {
  id: 'checkout-totals', name: 'koszyk', order: 61, source: { pageId: '0:1', desktopNodeId: '509:203' },
  desktop: { frameWidth: 1920, x: 1213, y: 364, width: 467, height: 473, containerWidth: 1440 },
  layout: { type: 'native-commerce-order-totals', designContextRead: true, alignment: 'right', controls: { couponInput: { width: 238, height: 43, border: '#c8c8c8', borderRadius: 15 }, couponButton: { width: 151, height: 44 }, submitButton: { width: 224, height: 44, borderRadius: 30, fill: '#056839' }, dividerWidth: 395 } },
  typography: [
    { nodeIds: ['509:210', '509:211'], fontFamily: 'DM Sans', fontWeight: 700, fontSize: 24, color: '#070707' }, { nodeId: '509:209', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 14, color: '#c8c8c8' },
    { nodeIds: ['509:207', '509:217'], fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, color: '#ffffff', alignment: 'center' }, { nodeIds: ['509:212', '509:213', '509:214'], fontFamily: 'DM Sans', fontWeight: 700, fontSize: 18, color: '#070707' }, { nodeId: '509:215', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 32, color: '#070707', alignment: 'right' }
  ],
  assets: [{ sourceNodeId: '509:204', path: 'assets/checkout/checkout-totals-card.svg', usage: 'totals-card-background' }, { sourceNodeId: '509:205', path: 'assets/checkout/checkout-totals-divider.svg', usage: 'totals-divider' }, { sourceNodeId: '509:206', path: 'assets/checkout/checkout-coupon-button.svg', usage: 'coupon-submit-background' }],
  contentFields: text.map(([id, fieldName, value]) => ({ id, text: value, link: null })),
  notes: ['All displayed figures and the BLACKFRIDAY code are exact design-state data, not product/order fixtures. Native WooCommerce totals and coupons must provide live values.', 'The source action label is captured without a destination URL; submitting an order is not part of discovery.'], liveFigmaRequired: false
};
const manifestPath = path.join(snapshot, 'manifest.json'), contentPath = path.join(snapshot, 'content-map.json'); const manifest = read(manifestPath); manifest.sections = manifest.sections.filter(entry => entry.id !== section.id); manifest.sections.push({ id: section.id, name: section.name, order: section.order, pageId: '0:1', snapshot: 'sections/61-checkout-totals.json', desktopNodeId: '509:203', desktopReference: 'references/sections/checkout-totals.png' });
for (const [nodeId, name, type] of [['509:203', 'koszyk', 'GROUP'], ['509:204', 'Rectangle 102', 'VECTOR'], ['509:205', 'Line 20', 'LINE'], ['509:206', 'Rectangle 140', 'VECTOR']]) if (!manifest.frames.some(frame => frame.nodeId === nodeId)) manifest.frames.push({ nodeId, name, pageId: '0:1', type, viewport: 'desktop', language: 'pl' });
const content = read(contentPath); content.fields = content.fields.filter(field => field.section !== section.id); content.fields.push(...text.map(([nodeId, fieldName, value]) => ({ section: section.id, nodeId, fieldName: `rudnikagro_checkout_totals_${fieldName}`, type: 'text', language: 'pl', value, destination: 'WooCommerce native order totals / editable checkout labels', linkEvidence: [{ characters: value, hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: nodeId } })));
write(path.join(snapshot, 'sections/61-checkout-totals.json'), section); write(manifestPath, manifest); write(contentPath, content);
