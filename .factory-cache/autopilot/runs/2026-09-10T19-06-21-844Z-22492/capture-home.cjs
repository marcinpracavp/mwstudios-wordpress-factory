const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=process.cwd(),base=path.join(root,'.factory-cache/figma/latest');
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const write=(p,v)=>{const f=path.join(base,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
module.exports=async function(input){
 const {id,facts,assets=[],destination,fields={},notes=[]}=input;
 const m=read('manifest.json'),old=m.sections.find(s=>s.id===id),order=old?.order||m.sections.length+1;
 const section={id,name:facts.name,order,source:{pageId:'0:1',desktopNodeId:facts.id},desktop:{frameWidth:1920,...(input.bounds||facts.nodes[0].bounds)},layout:{type:input.type||'source-composition',productionFrame:facts.frame,designContextRead:input.designContextRead!==false,nodes:facts.nodes,styles:facts.styles||[]},typography:facts.nodes.filter(n=>n.segments).map(n=>({nodeId:n.id,segments:n.segments})),assets:[],notes,liveFigmaRequired:true};
 const filename=old?.snapshot||'sections/'+String(order).padStart(2,'0')+'-'+id+'.json',ref=old?.desktopReference||'references/sections/'+id+'.png';
 write(filename,section);
 const cm=read('content-map.json');
 for(const n of facts.nodes.filter(n=>typeof n.characters==='string')){
  const f={section:id,nodeId:n.id,fieldName:fields[n.id]||'rudnikagro_'+id.replaceAll('-','_')+'_'+n.id.replace(':','_'),type:'text',language:'pl',value:n.characters,destination,ownership:{project:'rudnikagro',sourceNodeId:n.id}};
  const i=cm.fields.findIndex(v=>v.section===id&&v.nodeId===n.id&&v.type==='text');if(i>=0)cm.fields[i]=f;else cm.fields.push(f);
 }write('content-map.json',cm);
 const obsPath='observations/detail-'+id+'.json';write(obsPath,{id:'detail-'+id,tool:'figma.use_figma',fileKey:m.source.fileKey,nodeIds:[facts.id],description:'Exact source section capture',recordedAt:new Date().toISOString(),source:'successful-worker-tool-event',facts:[facts]});
 const idx=read('observations/index.json');if(!idx.some(o=>o.id==='detail-'+id))idx.push({id:'detail-'+id,nodeIds:[facts.id],description:'Exact source section capture',path:obsPath});write('observations/index.json',idx);
 for(const n of facts.nodes)if(!m.frames.some(f=>f.nodeId===n.id))m.frames.push({nodeId:n.id,name:n.name,pageId:'0:1',type:n.type,viewport:'desktop',language:'pl'});
 if(!old)m.sections.push({id,name:facts.name,order,pageId:'0:1',snapshot:filename,desktopNodeId:facts.id,desktopReference:ref});
 const route=m.routes.find(r=>r.frameNodeId===facts.frame);route.sectionGeometry??={};route.sectionGeometry[id]={...(input.bounds||facts.nodes[0].bounds)};
 m.status='partial';write('manifest.json',m);
 for(const a of assets){
  const target='assets/home/'+a.sourceNodeId.replaceAll(':','-')+'-'+(a.label||'source')+'.'+(a.url.match(/\.(svg|png|jpg|jpeg)(?:\?|$)/)?.[1]||'png'),abs=path.join(base,target);fs.mkdirSync(path.dirname(abs),{recursive:true});
  if(!fs.existsSync(abs)){const res=await fetch(a.url);if(!res.ok)throw new Error('Asset '+res.status+' '+a.sourceNodeId);const b=Buffer.from(await res.arrayBuffer());fs.writeFileSync(abs,b);write(target+'.source.json',{fileKey:m.source.fileKey,nodeId:a.sourceNodeId,url:a.url,sha256:hash(b),transport:'figma-mcp-asset',capturedAt:new Date().toISOString()});}
  section.assets.push({sourceNodeId:a.sourceNodeId,path:target,usage:a.usage||'Exact source export; geometry and crop recorded in layout.nodes.'});
  const f={section:id,nodeId:a.sourceNodeId,fieldName:'rudnikagro_'+id.replaceAll('-','_')+'_media_'+a.sourceNodeId.replaceAll(':','_'),type:'image',language:'pl',value:target,destination:destination+' / image attachment ID',ownership:{project:'rudnikagro',sourceNodeId:a.sourceNodeId}};
  if(!cm.fields.some(x=>x.section===id&&x.fieldName===f.fieldName))cm.fields.push(f);
 }write('content-map.json',cm);write(filename,section);
 if(!fs.existsSync(path.join(base,ref))){
  const source=facts.frame==='250:115'?'references/full/frame-250-115.png':'references/full/home.png',b=input.bounds||facts.nodes[0].bounds,crop=[Math.floor(b.x),Math.floor(b.y),Math.ceil(b.x+b.width)-Math.floor(b.x),Math.ceil(b.y+b.height)-Math.floor(b.y)];
  const {discoverBrowser,getChromium}=require(path.join(root,'scripts/factory/qa/browser')),found=discoverBrowser(),browser=await getChromium().launch({executablePath:found.browser.executablePath,headless:true});
  try{const page=await browser.newPage();const data=await page.evaluate(async({data,crop})=>{const img=new Image();img.src=data;await img.decode();const c=document.createElement('canvas');c.width=crop[2];c.height=crop[3];c.getContext('2d').drawImage(img,...crop,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];},{data:'data:image/png;base64,'+fs.readFileSync(path.join(base,source)).toString('base64'),crop});const bytes=Buffer.from(data,'base64');fs.writeFileSync(path.join(base,ref),bytes);write(ref+'.source.json',{fileKey:m.source.fileKey,nodeId:facts.id,productionFrame:facts.frame,source,crop,scale:1,transport:'unscaled-full-reference-crop',sourceSha256:hash(fs.readFileSync(path.join(base,source))),sha256:hash(bytes),capturedAt:new Date().toISOString()});}finally{await browser.close();}
 }
 section.liveFigmaRequired=input.incomplete===true;write(filename,section);console.log(JSON.stringify({id,nodes:facts.nodes.length,texts:facts.nodes.filter(n=>n.segments).length,assets:section.assets.length,snapshot:filename,reference:ref,liveFigmaRequired:section.liveFigmaRequired}));
};

