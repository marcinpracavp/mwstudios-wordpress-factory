const fs = require('fs');
const path = require('path');
const root = process.cwd();
const snapshot = path.join(root, '.factory-cache/figma/latest');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const text = [['492:755', 'delivery_heading', 'Dostawa'], ['492:746', 'courier_label', 'Shoper Przesyłki Kurier'], ['492:747', 'courier_price', '22,90 zł']];
const section = {
  id: 'checkout-delivery', name: 'dostawa', order: 60,
  source: { pageId: '0:1', desktopNodeId: '492:995' },
  desktop: { frameWidth: 1920, x: 240, y: 1926, width: 953, height: 216, containerWidth: 1440 },
  layout: { type: 'native-commerce-shipping-methods', designContextRead: true, columns: [{ x: 308, width: 399, role: 'shipping-method-list' }], alignment: 'left', controls: { rowHeight: 44, border: '#c8c8c8', borderRadius: 15, radioOuter: 17, radioInner: 11 } },
  typography: [
    { nodeId: '492:755', value: 'Dostawa', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 24, color: '#070707' },
    { nodeId: '492:746', value: 'Shoper Przesyłki Kurier', fontFamily: 'DM Sans', fontWeight: 400, fontSize: 16, color: '#000000' },
    { nodeId: '492:747', value: '22,90 zł', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#006633', alignment: 'right' }
  ],
  assets: [
    { sourceNodeId: '492:744', path: 'assets/checkout/checkout-delivery-card.svg', usage: 'delivery-card-background' },
    { sourceNodeId: '492:756', path: 'assets/checkout/checkout-delivery-radio.svg', usage: 'delivery-radio' },
    { sourceNodeId: '492:760', path: 'assets/checkout/checkout-delivery-radio-active.svg', usage: 'selected-delivery-radio' }
  ],
  contentFields: text.map(([id, fieldName, value]) => ({ id, text: value, link: null })),
  notes: ['The delivery method label and price are exact Figma source content only; the configured WooCommerce shipping method is a downstream requirement.', 'The source displays the single shipping method as selected; no shipment or order was created.'],
  liveFigmaRequired: false
};
const manifestPath = path.join(snapshot, 'manifest.json'); const contentPath = path.join(snapshot, 'content-map.json');
const manifest = read(manifestPath); manifest.sections = manifest.sections.filter(entry => entry.id !== section.id); manifest.sections.push({ id: section.id, name: section.name, order: section.order, pageId: '0:1', snapshot: 'sections/60-checkout-delivery.json', desktopNodeId: '492:995', desktopReference: 'references/sections/checkout-delivery.png' });
for (const [nodeId, name, type] of [['492:995', 'dostawa', 'GROUP'], ['492:744', 'Rectangle 163', 'VECTOR'], ['492:756', 'Ellipse 32', 'ELLIPSE'], ['492:760', 'Ellipse 36', 'ELLIPSE']]) if (!manifest.frames.some(frame => frame.nodeId === nodeId)) manifest.frames.push({ nodeId, name, pageId: '0:1', type, viewport: 'desktop', language: 'pl' });
const content = read(contentPath); content.fields = content.fields.filter(field => field.section !== section.id); content.fields.push(...text.map(([nodeId, fieldName, value]) => ({ section: section.id, nodeId, fieldName: `rudnikagro_checkout_delivery_${fieldName}`, type: 'text', language: 'pl', value, destination: 'WooCommerce native shipping-method labels / editable checkout content', linkEvidence: [{ characters: value, hyperlink: null }], importStatus: 'pending-native-content-verification', ownership: { project: 'rudnikagro', sourceNodeId: nodeId } })));
write(path.join(snapshot, 'sections/60-checkout-delivery.json'), section); write(manifestPath, manifest); write(contentPath, content);
