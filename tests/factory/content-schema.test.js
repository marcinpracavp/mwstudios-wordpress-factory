const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fields = fs.readdirSync('acf-json').filter(f => f.startsWith('group_mwf_')).map(f => JSON.parse(fs.readFileSync(`acf-json/${f}`, 'utf8')));

test('Reusable schema: unique keys, attachment IDs, all renderer layouts, and usable locations', () => {
    const keys = new Set();
    const walk = nodes => {
        for (const field of nodes) {
            assert.ok(!keys.has(field.key), `duplicate ${field.key}`); keys.add(field.key);
            if (field.type === 'image' || field.type === 'file') assert.equal(field.return_format, 'id');
            if (field.type === 'link') assert.equal(field.return_format, 'array');
            assert.ok(!JSON.stringify(field).includes('cb.szczecin.pl'), 'client data must not enter schema');
            walk(field.sub_fields || []);
            for (const layout of Object.values(field.layouts || {})) {
                assert.ok(!keys.has(layout.key)); keys.add(layout.key);
                walk(layout.sub_fields);
            }
        }
    };
    fields.forEach(group => {
        walk(group.fields);
        for (const rule of group.location.flat()) if (rule.param === 'page_template') assert.ok(fs.existsSync(rule.value), rule.value);
    });
    const flexible = fields.flatMap(g => g.fields).find(f => f.name === 'mwf_sections');
    const layouts = Object.values(flexible.layouts).map(l => l.name).sort();
    assert.deepEqual(layouts, ['accordion', 'contact', 'cta', 'documents', 'gallery', 'image_text', 'media', 'news', 'partners', 'table', 'tabs', 'tiles', 'wysiwyg']);
    const formFields = fields.flatMap(g => g.fields).filter(f => f.name === 'mwf_form_id');
    assert.equal(formFields.length, 0, 'reuse kontakt.form instead of duplicate form setting');
});
