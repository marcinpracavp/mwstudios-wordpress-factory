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
module.exports={price,quantity,mayUpdate};
if(require.main===module) {
  try { console.log(JSON.stringify(price(JSON.parse(process.argv[2])))); }
  catch(e){console.error(e.message);process.exitCode=1;}
}
