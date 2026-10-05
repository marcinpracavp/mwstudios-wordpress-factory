const fs=require('fs');
const path=require('path');
const {ROOT,CACHE,inside,read,write,hash}=require('./common');
const file=path.join(CACHE,'template-evidence.json');
function key(plan,id,thresholds){return hash(JSON.stringify([plan.family,id,thresholds]));}
function reuse(plan,geometry,signature,thresholds) {
  if(!plan?.reusedSections.includes(geometry.id) || !geometry.passed || !fs.existsSync(file)) return null;
  const record=read(file)[key(plan,geometry.id,thresholds)];
  if(!record || record.signature!==signature) return null;
  const evidence=inside(ROOT,record.comparison);
  if(!fs.existsSync(evidence)||hash(fs.readFileSync(evidence))!==record.evidenceHash) return null;
  return record;
}
function record(plan,result,comparison,thresholds) {
  if(!plan || plan.baseRoute!==result.id || !result.acceptance?.pagePassed) return;
  const data=fs.existsSync(file)?read(file):{};
  for(const crop of result.pixels.crops) {
    const geometry=result.geometry.find(g=>g.id===crop.id);
    if(!geometry?.passed||!crop.signature||crop.ratio>thresholds.maxDifferentPixelRatio) continue;
    data[key(plan,crop.id,thresholds)]={signature:crop.signature,comparison,section:crop.id,
      evidenceHash:hash(fs.readFileSync(inside(ROOT,comparison))),sourceRoute:result.id};
  }
  write(file,data);
}
module.exports={reuse,record};
