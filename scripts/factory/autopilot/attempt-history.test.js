const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { key, forTask, isSemanticRepair } = require('./attempt-history');

test('semantic attempt history survives changing repair round ids', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'factory-attempt-history-'));
  try {
    const attempts=['round-1','round-7','recovery'].map((name,index)=>{
      const dir=path.join(root,name);fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,'task-capsule.json'),JSON.stringify({routes:[{id:'about'}],focusSections:['overview']}));
      return {dir,taskType:index===2?'source-extraction':'style-fix'};
    });
    const history=forTask({attempts},{routes:['about'],sections:['overview']});
    assert.equal(history.repair.length,2);assert.equal(history.source.length,1);
    assert.equal(key({routes:['about'],sections:['overview']}),history.key);
  } finally { fs.rmSync(root,{recursive:true}); }
});

test('only semantic diagnostics consume the cross-round semantic repair budget', () => {
  assert.equal(isSemanticRepair({ diagnostic: { reason: 'SEMANTIC_SECTION_INCOMPLETE: footer' } }), true);
  assert.equal(isSemanticRepair({ title: 'UNREGISTERED_SECTION: teaser' }), true);
  assert.equal(isSemanticRepair({ title: 'Section geometry differs', issues: ['footer pixel mismatch'] }), false);
});
