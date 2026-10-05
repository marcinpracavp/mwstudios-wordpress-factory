const fs=require('fs');
const path=require('path');
const {SNAPSHOT,hash,inside,read}=require('./common');
let cache=null;
async function verifySources(page,images,baseUrl){
  // Byte identity is stricter than a matching file name. Resized or unavailable media stay unverified.
  if(!cache){
    cache=new Map();const file=path.join(SNAPSHOT,'content-map.json');
    for(const field of fs.existsSync(file)?read(file).fields||[]:[]){
      const visit=(value,node)=>{
        if(typeof value==='string'&&/\.(png|jpe?g|webp)$/i.test(value)){
          try{const file=inside(SNAPSHOT,value);if(fs.existsSync(file)){const key=`${field.section}:${node}`;if(!cache.has(key))cache.set(key,new Set());cache.get(key).add(hash(fs.readFileSync(file)));}}catch{}
        }else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value))if(key!=='sourceNodeId')visit(child,value.sourceNodeId||node);
      };visit(field.value,field.nodeId);
    }
  }
  for(const im of images){
    im.sourceIdentityVerified=false;
    const expected=cache.get(`${im.section}:${im.sourceNodeId}`);
    if(!expected||!im.loaded||im.width<80||im.height<80)continue;
    try{
      const url=new URL(im.src,baseUrl);if(url.origin!==new URL(baseUrl).origin)continue;
      const response=await page.request.get(url.href,{timeout:10000});
      if(!response.ok())continue;
      const bytes=await response.body();im.sourceIdentityVerified=expected.has(hash(bytes));
      if(im.sourceIdentityVerified)im.sourceSha256=hash(bytes);
    }catch{/* Unknown identity never gets a pixel exception. */}
  }
  return images;
}
module.exports={verifySources};
