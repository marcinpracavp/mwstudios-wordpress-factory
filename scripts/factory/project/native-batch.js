const { wp } = require('../autopilot/wp');
const { demoClones } = require('../autopilot/commerce-policy');

function sourceKey(record) {
  return `${String(record?.language || '')}:${String(record?.nodeId || '')}:${String(record?.fieldName || '')}`;
}

function assertBatch(records, keys) {
  if (!Array.isArray(records) || !Array.isArray(keys) || records.length !== keys.length) {
    throw new Error('Native batch records and keys must have equal lengths.');
  }
  const recordKeys = records.map(sourceKey);
  if (new Set(recordKeys).size !== recordKeys.length || new Set(keys).size !== keys.length || recordKeys.some((key) => !keys.includes(key))) {
    throw new Error('Native batch keys must match exactly; missing or extra records are not allowed.');
  }
}

function parseProbe(output) {
  try { return JSON.parse(output); } catch (error) { throw new Error(`Native commerce probe returned invalid JSON: ${error.message}`); }
}

function assertProbeScope(products, keys) {
  const observedKeys = products.map((product) => String(product?.sourceKey || ''));
  if (new Set(observedKeys).size !== observedKeys.length || observedKeys.some((key) => !keys.includes(key))) {
    throw new Error('Native commerce probe returned duplicate or out-of-scope product records.');
  }
}

function assertExactScope(records, keys, label) {
  const observedKeys = records.map((record) => String(record?.sourceKey || record?.key || ''));
  if (records.length !== keys.length || new Set(observedKeys).size !== observedKeys.length || observedKeys.some((key) => !keys.includes(key))) {
    throw new Error(`${label} returned missing, duplicate, or out-of-scope records.`);
  }
}

function nullable(value) {
  return value === '' || value === null || value === undefined ? null : String(value);
}

function technicalData(acf) {
  const technical = acf && acf.rudnikagro_product_technical_data;
  return Array.isArray(technical) ? technical.map((row) => ({
    label: String(row?.label || ''),
    value: String(row?.value || ''),
  })) : [];
}

function observedProduct(product) {
  return {
    id: Number(product.id),
    sourceKey: String(product.sourceKey || ''),
    sourceNode: String(product.sourceNode || ''),
    sourceSection: String(product.sourceSection || ''),
    route: String(product.route || ''),
    listingRelation: product.listingRelation || null,
    title: String(product.title || ''),
    description: String(product.description || ''),
    ctaLabel: String(product.ctaLabel || ''),
    ctaSourceNode: String(product.ctaSourceNode || ''),
    imageId: Number(product.imageId || 0),
    imageSourceNode: String(product.imageSourceNode || ''),
    imageSourceAsset: String(product.imageSourceAsset || ''),
    regularPrice: nullable(product.regularPrice),
    salePrice: nullable(product.salePrice),
    priceProvenance: product.priceProvenance || null,
    terms: product.terms || {},
    attributes: product.attributes || [],
    variations: product.variations || [],
    reviews: product.reviews || [],
    acf: product.acf || {},
    technicalData: technicalData(product.acf || {}),
  };
}

function matchesSource(record, actual) {
  const value = record.value || {};
  const media = value.media || {};
  const cta = value.cta || {};
  const expectedSpecs = Array.isArray(value.specifications) ? value.specifications.map((specification) => {
    const [label, ...rest] = String(specification).split(':');
    return { label: label.trim(), value: (rest.join(':').trim() || label.trim()) };
  }) : [];
  const priceIsUninvented = value.price !== null || (actual.regularPrice === null && actual.salePrice === null) || !actual.priceProvenance?.sourcePrice;
  return actual.sourceKey === sourceKey(record)
    && actual.sourceNode === String(record.nodeId || '')
    && actual.sourceSection === 'product-list-items'
    && actual.title === String(value.title || '')
    && actual.description === String(value.description || '')
    && actual.imageSourceNode === String(media.sourceNodeId || '')
    && actual.imageSourceAsset === String(media.path || '')
    && (value.price === null ? priceIsUninvented : actual.regularPrice === nullable(value.price))
    && actual.ctaLabel === String(cta.label || '')
    && actual.ctaSourceNode === String(cta.sourceNodeId || '')
    && JSON.stringify(actual.technicalData) === JSON.stringify(expectedSpecs);
}

function matchesListing(record, actual, orderIndex, orders, hasOverride) {
  const relation = actual.listingRelation || {};
  const order = Number(relation.menuOrder);
  const orderIsAscending = Number.isInteger(order) && (hasOverride || orderIndex === 0 || order > orders[orderIndex - 1]);
  return matchesSource(record, actual)
    && actual.route === 'product-list-items'
    && relation.route === 'product-list-items'
    && orderIsAscending;
}

function normalizedContentValue(value) {
  return Array.isArray(value) ? value.map(String).join('\n') : String(value ?? '');
}

function catalogueDemoClonePlans(records) {
  if (!records.some((record) => record?.section === 'catalogues-secondary')) return [];
  return demoClones({
    records: [
      { id: 'catalogues-secondary-card-1', sourceId: '125:2544' },
      { id: 'catalogues-secondary-card-2', sourceId: '125:2548' },
      { id: 'catalogues-secondary-card-3', sourceId: '125:2552' },
      { id: 'catalogues-secondary-card-4', sourceId: '125:2556' },
    ],
    requiredCount: 124,
    kind: 'post',
    owner: 'catalogues-secondary',
  });
}

function productListDemoClonePlans(records) {
  if (!records.some((record) => record?.section === 'product-list-items')) return [];
  const originals = records
    .filter((record) => record?.section === 'product-list-items' && record?.type === 'product')
    .map((record) => ({
      id: String(record.nodeId || ''),
      sourceId: String(record.value?.media?.sourceNodeId || ''),
    }))
    .filter((record) => record.id && record.sourceId);
  return demoClones({
    records: originals,
    requiredCount: 124,
    kind: 'product-card',
    owner: 'product-list-items',
  });
}

function observedContent(content) {
  return {
    sourceKey: String(content.sourceKey || ''),
    sourceNode: String(content.sourceNode || ''),
    sourceField: String(content.sourceField || ''),
    sourceSection: String(content.sourceSection || ''),
    targetField: String(content.targetField || ''),
    targetFieldKey: String(content.targetFieldKey || ''),
    sourceIdentity: String(content.sourceIdentity || ''),
    nativeIdentity: String(content.nativeIdentity || ''),
    lastImportedValue: content.lastImportedValue == null ? null : String(content.lastImportedValue),
    nativeId: content.nativeId == null ? null : String(content.nativeId),
    targetStorage: String(content.targetStorage || ''),
    preservedOverride: content.preservedOverride === true,
    value: content.value == null ? null : String(content.value),
    mediaId: content.mediaId == null ? null : Number(content.mediaId),
    mediaSourceNode: String(content.mediaSourceNode || ''),
    mediaSourceAsset: String(content.mediaSourceAsset || ''),
    mediaSourceSection: String(content.mediaSourceSection || ''),
  };
}

function contentTarget(record) {
  const fieldName = String(record?.fieldName || '');
  const sharedHeaderTargets = {
    rudnikagro_shared_header_tagline_125_10: { field: 'rudnikagro_shared_header_tagline_125_10', key: '', storage: 'option', identity: '' },
    rudnikagro_shared_header_phone_125_11: { field: 'rudnikagro_shared_secondary_navigation_156_92', key: 'field_ra_phone', storage: 'acf', identity: '' },
    rudnikagro_shared_header_mobile_125_12: { field: 'rudnikagro_shared_header_mobile_125_12', key: '', storage: 'option', identity: '' },
    rudnikagro_shared_header_email_125_13: { field: 'rudnikagro_shared_secondary_navigation_93_31', key: 'field_ra_email', storage: 'acf', identity: '' },
    rudnikagro_shared_header_primary_navigation_125_5: { field: 'rudnikagro_shared_primary_navigation_93_29', key: 'field_ra_primary_source', storage: 'acf', identity: '' },
  };
  if (sharedHeaderTargets[fieldName]) return sharedHeaderTargets[fieldName];
  const menu = /^emko_product_list_menu_(category_(?:[1-9]|arrow)|heading)_\d+_\d+$/.exec(fieldName);
  if (menu) {
    const suffix = fieldName.replace(/^emko_product_list_menu_/, '').replace(/_\d+_\d+$/, '');
    return { field: fieldName, key: `field_ra_product_list_menu_${suffix}`, storage: 'acf', identity: 'product-list-menu' };
  }
  if (/^emko_product_list_filters_(heading|strength_label|strength_unit|strength_min|strength_max|extension_label|extension_unit|extension_min|extension_max|button)_\d+_\d+$/.test(fieldName)) {
    return { field: fieldName, key: '', storage: 'option', identity: 'product-list-filters' };
  }
  const productRouteField = /^emko_product_(detail_(title|image|description|features|breadcrumb_(home|category|current)|contact_label|download_label|download_icon|benefits_heading)|gallery_image_[12]|specification_(tabs|table_header|row_[1-8])|contact_cta_(background|arrow|heading|button_label))_\d+_\d+$/.exec(fieldName);
  if (productRouteField) {
    return {
      field: fieldName,
      key: '',
      storage: 'option',
      identity: productRouteField[1].startsWith('detail_') ? 'product-detail'
        : productRouteField[1].startsWith('gallery_') ? 'product-gallery'
          : productRouteField[1].startsWith('specification_') ? 'product-specification'
            : 'product-contact-cta',
    };
  }
  const productRelatedShared = /^emko_product_related_(heading|all_label|all_icon)_\d+_\d+$/.exec(fieldName);
  if (productRelatedShared) {
    const suffix = fieldName.replace(/^emko_product_related_/, '').replace(/_\d+_\d+$/, '');
    return { field: fieldName, key: `field_ra_product_related_${suffix}`, storage: 'acf', identity: 'product-related' };
  }
  if (/^emko_product_related_card_arrow_\d+_\d+$/.test(fieldName)) {
    return {
      field: fieldName,
      key: 'field_ra_product_related_card_arrow',
      storage: 'acf',
      identity: 'product-related-arrow-icon',
    };
  }
  const productRelatedCard = /^emko_product_related_card_(\d+)_(image|title|description)_\d+_\d+$/.exec(fieldName);
  if (productRelatedCard) {
    const field = productRelatedCard[2];
    return {
      field: field === 'title' ? 'post_title' : (field === 'description' ? 'post_excerpt' : 'post_thumbnail'),
      key: '',
      storage: field === 'image' ? 'product-media' : 'product',
      identity: `product-related-card-${Number(productRelatedCard[1])}`,
    };
  }
  if (/^emko_home_product_categories_item_[0-9]+_label_\d+_\d+$/.test(fieldName)) {
    return { field: fieldName, key: '', storage: 'option', identity: '' };
  }
  const aboutHero = /^emko_about_hero_(?:background|pattern_a|pattern_b|body|image|title|button_label)_\d+_\d+$/.test(String(record?.fieldName || ''));
  if (aboutHero) {
    return {
      field: String(record.fieldName),
      key: '',
      storage: 'option',
      identity: sourceKey(record),
    };
  }
  if (/^emko_service_media_band_(image|mask)_\d+_\d+$/.test(String(record?.fieldName || ''))) {
    return {
      field: String(record.fieldName),
      key: '',
      storage: 'option',
      identity: sourceKey(record),
    };
  }
  const relatedShared = /^emko_blog_post_related_(heading|all_label|all_arrow)_\d+_\d+$/.exec(String(record?.fieldName || ''));
  if (relatedShared) {
    return {
      field: String(record.fieldName),
      key: '',
      storage: 'option',
      identity: 'blog-post-related',
    };
  }
  if (/^emko_blog_post_article_body_\d+_\d+$/.test(fieldName)) {
    return {
      field: fieldName,
      key: '',
      storage: 'option',
      identity: 'blog-post-article',
    };
  }
  const relatedCard = /^emko_blog_post_related_card_(\d+)_(image|title|excerpt|date)_\d+_\d+$/.exec(String(record?.fieldName || ''));
  if (relatedCard) {
    const field = relatedCard[2];
    return {
      field: field === 'title' ? 'post_title' : (field === 'excerpt' ? 'post_excerpt' : (field === 'date' ? 'rudnikagro_blog_card_date' : 'rudnikagro_blog_card_image')),
      key: field === 'date' ? 'field_ra_blog_card_date' : (field === 'image' ? 'field_ra_blog_card_image' : ''),
      storage: ['image', 'date'].includes(field) ? 'post-acf' : 'post',
      identity: `blog-post-related-card-${relatedCard[1]}`,
    };
  }
  const secondaryCatalogue = /^emko_catalogues_secondary_card_(\d+)_(title|download_label)_\d+_\d+$/.exec(String(record?.fieldName || ''));
  if (secondaryCatalogue) {
    const card = Number(secondaryCatalogue[1]);
    const subfield = secondaryCatalogue[2] === 'download_label' ? 'download_label' : 'title';
    return {
      field: `rudnikagro_catalogues_secondary_card_${card}_${subfield}`,
      key: '',
      storage: 'option',
      identity: '',
    };
  }
  const catalogue = /^emko_catalogues_primary_card_(\d+)_(title|download_label)_\d+_\d+$/.exec(String(record?.fieldName || ''));
  if (catalogue) {
    const card = Number(catalogue[1]);
    const subfield = catalogue[2] === 'download_label' ? 'pdf_label' : 'title';
    return {
      field: `rudnikagro_catalogues[${card - 1}].${subfield}`,
      key: 'field_ra_catalogues_cards',
      storage: 'post-acf',
      identity: `catalogues-primary-card-${card}`,
    };
  }
  const match = /^rudnikagro_blog_archive_card_(\d+)_(title|excerpt|meta)_\d+_\d+$/.exec(String(record?.fieldName || ''));
  if (!match) return { field: String(record?.fieldName || ''), storage: 'option', identity: '' };
  return {
    field: match[2] === 'title' ? 'post_title' : (match[2] === 'excerpt' ? 'post_excerpt' : 'rudnikagro_blog_card_date'),
    key: match[2] === 'meta' ? 'field_ra_blog_card_date' : '',
    storage: match[2] === 'meta' ? 'post-acf' : 'post',
    identity: `blog-archive-card-${match[1]}`,
  };
}

function matchesContent(record, actual) {
  const expected = normalizedContentValue(record.value);
  const target = contentTarget(record);
  const preservedOverride = actual.preservedOverride === true
    || (actual.lastImportedValue === expected && actual.value !== expected);
  const media = record.value?.media || {};
  const mediaMatches = record.type === 'image'
    ? Number(actual.mediaId || 0) > 0
      && actual.mediaSourceNode === String(media.sourceNodeId || '')
      && actual.mediaSourceAsset === String(media.path || '')
      && actual.mediaSourceSection === String(record.section || '')
    : true;
  return actual.sourceKey === sourceKey(record)
    && actual.sourceNode === String(record.nodeId || '')
    && actual.sourceField === String(record.fieldName || '')
    && actual.sourceSection === String(record.section || '')
    && actual.sourceIdentity === sourceKey(record)
    && actual.targetField === target.field
    && actual.targetFieldKey === String(target.key || '')
    && actual.targetStorage === target.storage
    && actual.nativeIdentity === target.identity
    && (record.type === 'image' ? (mediaMatches || actual.preservedOverride === true) : (actual.value === expected || preservedOverride));
}

function contentSourceKeys(records) {
  return records.map((record) => sourceKey(record));
}

async function importContentBatch({ records, keys }) {
  assertBatch(records, keys);
  const catalogueDemoClones = catalogueDemoClonePlans(records);
  const output = wp(['eval-file', 'scripts/factory/project/import-content.php'], {
    env: {
      FACTORY_RUDNIKAGRO_CONTENT_KEYS: JSON.stringify(keys),
      FACTORY_RUDNIKAGRO_CONTENT_RECORDS: JSON.stringify(records),
      FACTORY_RUDNIKAGRO_CATALOGUES_DEMO_CLONES: JSON.stringify(catalogueDemoClones),
    },
  });
  const result = parseProbe(output);
  const imported = Array.isArray(result?.rudnikagro_scoped_content) ? result.rudnikagro_scoped_content : [];
  assertExactScope(imported, keys, 'Scoped content importer');
  return result;
}

async function importListingBatch({ records, keys }) {
  assertBatch(records, keys);
  const output = wp(['eval-file', 'scripts/factory/project/import-content.php'], {
    env: { FACTORY_RUDNIKAGRO_LISTING_KEYS: JSON.stringify(keys) },
  });
  const result = parseProbe(output);
  const imported = Array.isArray(result?.rudnikagro_scoped_listing_bind) ? result.rudnikagro_scoped_listing_bind : [];
  assertExactScope(imported, keys, 'Scoped listing binder');
  return result;
}

async function importBatch({ kind, records, keys }) {
  const resolvedKind = kind || (records?.every((record) => record?.type === 'product') ? 'product-import' : 'content-import');
  if (resolvedKind === 'content-import') return importContentBatch({ records, keys });
  if (resolvedKind === 'listing-bind') return importListingBatch({ records, keys });
  if (resolvedKind !== 'product-import') throw new Error(`Unsupported native batch kind: ${resolvedKind}`);
  assertBatch(records, keys);
  const productDemoClones = productListDemoClonePlans(records);
  const output = wp(['eval-file', 'scripts/factory/project/import-content.php'], {
    env: {
      FACTORY_RUDNIKAGRO_PRODUCT_KEYS: JSON.stringify(keys),
      FACTORY_RUDNIKAGRO_PRODUCT_DEMO_CLONES: JSON.stringify(productDemoClones),
    },
  });
  const result = parseProbe(output);
  const imported = Array.isArray(result?.rudnikagro_scoped_import) ? result.rudnikagro_scoped_import : [];
  const importedKeys = imported.map((product) => String(product?.key || ''));
  if (imported.length !== keys.length || new Set(importedKeys).size !== importedKeys.length || importedKeys.some((key) => !keys.includes(key))) {
    throw new Error('Scoped product importer returned missing or out-of-scope records.');
  }
  return result;
}

async function verifyBatch({ kind, records, keys, readOnly = true }) {
  if (readOnly !== true) throw new Error('verifyBatch is read-only by contract.');
  if (kind && !['product-import', 'listing-bind', 'content-import'].includes(kind)) throw new Error(`Unsupported native batch kind: ${kind}`);
  assertBatch(records, keys);
  if (kind === 'listing-bind') {
    const nodes = records.map((record) => String(record.nodeId || '')).filter(Boolean);
    const output = wp(['eval-file', 'scripts/factory/project/commerce-probe.php'], {
      env: {
        FACTORY_RUDNIKAGRO_LISTING_KEYS: JSON.stringify(keys),
        FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_KEYS: JSON.stringify(keys),
        FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_NODES: JSON.stringify(nodes),
      },
    });
    const probe = parseProbe(output);
    const products = Array.isArray(probe.ownedProducts) ? probe.ownedProducts : [];
    assertProbeScope(products, keys);
    const byKey = new Map(products.map((product) => [String(product.sourceKey || ''), product]));
    const actuals = records.map((record) => observedProduct(byKey.get(sourceKey(record)) || { sourceKey: sourceKey(record) }));
    const orders = actuals.map((actual) => Number(actual.listingRelation?.menuOrder));
    const hasOverride = actuals.some((actual) => actual.listingRelation?.preservedOverride === true);
    return {
      readOnly: true,
      records: records.map((record, index) => {
        const key = sourceKey(record);
        const actual = actuals[index];
        return { key, passed: byKey.has(key) && matchesListing(record, actual, index, orders, hasOverride), observed: actual };
      }),
    };
  }
  if (kind === 'content-import' || (kind === undefined && records.every((record) => record?.type !== 'product'))) {
    const output = wp(['eval-file', 'scripts/factory/project/commerce-probe.php'], {
      env: {
        FACTORY_RUDNIKAGRO_CONTENT_SOURCE_KEYS: JSON.stringify(contentSourceKeys(records)),
        FACTORY_RUDNIKAGRO_CONTENT_RECORDS: JSON.stringify(records),
      },
    });
    const probe = parseProbe(output);
    const content = Array.isArray(probe.ownedContent) ? probe.ownedContent : [];
    assertExactScope(content, keys, 'Native content probe');
    const byKey = new Map(content.map((item) => [String(item.sourceKey || ''), item]));
    return {
      readOnly: true,
      records: records.map((record) => {
        const key = sourceKey(record);
        const actual = byKey.has(key) ? observedContent(byKey.get(key)) : { sourceKey: key, missing: true };
        return { key, passed: !actual.missing && matchesContent(record, actual), observed: actual };
      }),
    };
  }
  const nodes = records.map((record) => String(record.nodeId || '')).filter(Boolean);
  const output = wp(['eval-file', 'scripts/factory/project/commerce-probe.php'], {
    env: {
      FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_KEYS: JSON.stringify(keys),
      FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_NODES: JSON.stringify(nodes),
    },
  });
  const probe = parseProbe(output);
  const products = Array.isArray(probe.ownedProducts) ? probe.ownedProducts : [];
  assertProbeScope(products, keys);
  const result = records.map((record) => {
    const key = sourceKey(record);
    const matches = products.filter((product) => String(product.sourceKey || '') === key);
    const actual = matches.length === 1 ? observedProduct(matches[0]) : {
      sourceKey: key,
      missing: matches.length === 0,
      duplicateCount: matches.length,
    };
    return { key, passed: matches.length === 1 && matchesSource(record, actual), observed: actual };
  });
  return { readOnly: true, records: result };
}

module.exports = { importBatch, verifyBatch };
