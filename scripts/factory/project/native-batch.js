const path = require('path');
const { wp } = require('../autopilot/wp');

const IMPORTER = path.join(__dirname, 'import-content.php');
const PROBE = path.join(__dirname, 'commerce-probe.php');

function sourceNode(record) {
  return String(record?.nodeId || '');
}

function sourceKey(record) {
  return `${String(record?.language || '')}:${sourceNode(record)}:${String(record?.fieldName || '')}`;
}

function sourceTitle(record) {
  return String(record?.value?.title || '').replace(/\u00c2/g, '').replace(/&nbsp;/gi, ' ').replace(/[\u00a0\s]+/g, ' ').trim();
}

function nativeTitle(value) {
  return String(value || '').replace(/&nbsp;/gi, ' ').replace(/[\u00a0\s]+/g, ' ').trim();
}

function sourcePrice(record) {
  const value = String(record?.value?.price || '').replace(/\u00c2/g, '');
  const match = value.match(/[0-9][0-9\s\u00a0\u202f]*[,.][0-9]{2}/);
  if (!match) return null;
  return Number(match[0].replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')).toFixed(2);
}

function assertBatch(records, keys) {
  if (!Array.isArray(records) || !Array.isArray(keys) || records.length !== keys.length) {
    throw new Error('Native batch records and keys must have equal lengths.');
  }
  const recordKeys = records.map(sourceKey);
  if (new Set(recordKeys).size !== recordKeys.length || new Set(keys).size !== keys.length || recordKeys.some((key) => !keys.includes(key))) {
    throw new Error('Native batch keys must match exactly; missing or extra records are not allowed.');
  }
  if (records.some((record) => record?.type !== 'product' || record?.section !== 'archive-product-grid')) {
    throw new Error('Native batch contains an unsupported record.');
  }
}

function runWpJson(script, envKey, values) {
  const output = wp(['eval-file', script], {
    env: { ...process.env, [envKey]: JSON.stringify(values) },
  });
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Invalid native probe/import JSON: ${error.message}`);
  }
}

async function importBatch({ records, keys }) {
  assertBatch(records, keys);
  return runWpJson(IMPORTER, 'FACTORY_RUDNIKAGRO_PRODUCT_KEYS', keys);
}

async function verifyBatch({ kind, records, keys, readOnly = true }) {
  if (readOnly !== true) throw new Error('verifyBatch is read-only by contract.');
  if (kind && kind !== 'product-import') throw new Error(`Unsupported native batch kind: ${kind}`);
  assertBatch(records, keys);
  const bySourceNode = new Map(records.map((record) => [sourceNode(record), record]));
  const probe = runWpJson(PROBE, 'FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_NODES', [...bySourceNode.keys()]);
  const observedByKey = new Map((probe.ownedProducts || []).map((product) => [String(product.sourceKey || ''), product]));
  const observedByNode = new Map((probe.ownedProducts || []).map((product) => [String(product.sourceNode || ''), product]));
  const exactNativeSet = (probe.ownedProducts || []).length === records.length
    && new Set((probe.ownedProducts || []).map((product) => String(product.sourceNode || ''))).size === records.length
    && (probe.ownedProducts || []).every((product) => bySourceNode.has(String(product.sourceNode || '')));
  const result = records.map((record) => {
    const key = sourceKey(record);
    const expectedNode = sourceNode(record);
    const expectedMedia = record.value?.media || {};
    const actual = observedByKey.get(key) || observedByNode.get(expectedNode) || null;
    const observed = actual ? {
      id: actual.id,
      sourceKey: actual.sourceKey,
      sourceNode: actual.sourceNode,
      title: actual.title,
      status: actual.status,
      route: actual.route,
      imageId: actual.imageId,
      imageSourceNode: actual.imageSourceNode,
      imageSourceAsset: actual.imageSourceAsset,
      regularPrice: actual.regularPrice,
      salePrice: actual.salePrice,
      priceProvenance: actual.priceProvenance,
      terms: actual.terms,
      attributes: actual.attributes,
      variations: actual.variations,
      reviews: actual.reviews,
      acf: actual.acf,
    } : { sourceKey: key, sourceNode: expectedNode, missing: true };
    const passed = exactNativeSet
      && Boolean(actual)
      && actual.sourceNode === expectedNode
      && (actual.sourceKey === key || !actual.sourceKey)
      && nativeTitle(actual.title) === sourceTitle(record)
      && String(actual.regularPrice || '') === sourcePrice(record)
      && String(actual.imageSourceNode || '') === String(expectedMedia.sourceNodeId || '')
      && String(actual.imageSourceAsset || '') === String(expectedMedia.path || '')
      && actual.route === 'product-archive';
    return { key, passed, observed };
  });
  return { readOnly: true, records: result };
}

module.exports = { importBatch, verifyBatch };
