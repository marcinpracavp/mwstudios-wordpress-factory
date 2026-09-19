// Source-first variation pricing. No product records are created by this helper.
const units={ml:{kind:'volume',factor:1},l:{kind:'volume',factor:1000},g:{kind:'mass',factor:1},kg:{kind:'mass',factor:1000},ha:{kind:'area',factor:1}};
function quantity(value) {
  const match=String(value).trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(ml|l|kg|g|ha)$/);
  if(!match || Number(match[1].replace(',','.'))<=0) throw new Error('UNSUPPORTED_SOURCE_QUANTITY');
  const unit=units[match[2]];
  return {kind:unit.kind,amount:Number(match[1].replace(',','.'))*unit.factor};
}
function price({basePrice,baseQuantity,targetQuantity,sourcePrice=null,decimals=2}) {
  if(!Number.isInteger(decimals)||decimals<0||decimals>6) throw new Error('INVALID_CURRENCY_PRECISION');
  const valid=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
  if(sourcePrice!==null) {
    if(!valid(sourcePrice)) throw new Error('INVALID_SOURCE_PRICE');
    return {price:sourcePrice,provenance:'figma-explicit',calculated:false};
  }
  if(!valid(basePrice)) throw new Error('SOURCE_BASE_PRICE_REQUIRED');
  const base=quantity(baseQuantity),target=quantity(targetQuantity);
  if(base.kind!==target.kind) throw new Error('INCOMPATIBLE_VARIATION_UNITS');
  const amount=basePrice*target.amount/base.amount;
  return {price:Math.round((amount+Number.EPSILON)*10**decimals)/10**decimals,
    provenance:'user-authorized-proportional',calculated:true,basePrice,baseQuantity,targetQuantity,decimals};
}
function mayUpdate({current,lastImported,owned}) {
  return owned===true && lastImported!==undefined && current===lastImported;
}
// Explicitly authorized demo duplication. This plans owned native records; it never fakes query totals.
function demoClones({ records, requiredCount, kind, owner }) {
  if (!['slide','post','product-card'].includes(kind) || !owner || !Number.isSafeInteger(requiredCount) || requiredCount < 0 || requiredCount > 200) throw Error('INVALID_DEMO_CLONE_SCOPE');
  if (!Array.isArray(records) || records.some(r=>!r.sourceId || !r.id)) throw Error('DEMO_CLONE_SOURCE_REQUIRED');
  if (!records.length && requiredCount) throw Error('NO_SOURCE_RECORD_TO_CLONE');
  const originals=records.filter(r=>!r.cloneOf), existing=new Set(records.map(r=>r.importKey).filter(Boolean)), planned=[];
  if (!originals.length && requiredCount>records.length) throw Error('ORIGINAL_SOURCE_RECORD_REQUIRED');
  for(let i=0;records.length+planned.length<requiredCount;i++) {
    const original=originals[i%originals.length], key=`${owner}:demo:${kind}:${original.sourceId}:${Math.floor(i/originals.length)+1}`;
    if(existing.has(key)) continue;
    planned.push({importKey:key,cloneOf:original.id,sourceId:original.sourceId,demo:true,owner});
  }
  return planned;
}
module.exports={price,quantity,mayUpdate,demoClones};
if(require.main===module) {
  try { console.log(JSON.stringify(price(JSON.parse(process.argv[2])))); }
  catch(e){console.error(e.message);process.exitCode=1;}
}
