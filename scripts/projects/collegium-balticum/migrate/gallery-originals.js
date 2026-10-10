/** CB-05 only: exact href allowlist from the verified rendered source; no crawling. */
const fs=require('fs'),path=require('path');
const {sha,manifest,verify,zip,unzip}=require('../../../../tools/live-capture/bundle');
const config=require('../../../../docs/projects/collegium-balticum/live.json');
const source=require('../../../../docs/projects/collegium-balticum/TASK-4E-GALLERY-ORIGINALS.json');
const sourceHash=sha(Buffer.from(JSON.stringify(source)));
function dimensions(bytes){
  if(bytes[0]!==255||bytes[1]!==216)throw Error('Not a JPEG');
  let offset=2;
  while(offset+4<=bytes.length){
    if(bytes[offset++]!==255)throw Error('Invalid JPEG marker');
    while(bytes[offset]===255)offset++;
    const marker=bytes[offset++];if(marker===217||marker===218)break;
    if(marker===1||(marker>=208&&marker<=215))continue;
    const length=bytes.readUInt16BE(offset);if(length<2||offset+length>bytes.length)throw Error('Invalid JPEG length');
    if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
      if(length<8)throw Error('Invalid JPEG frame');return{width:bytes.readUInt16BE(offset+5),height:bytes.readUInt16BE(offset+3)};
    }offset+=length;
  }throw Error('JPEG dimensions missing');
}
function validate(bytes,item,mime){
  if(!/^image\/jpeg(?:;|$)/i.test(mime||''))throw Error('Unexpected MIME');
  const size=dimensions(bytes);
  const widths=[...item.srcset.matchAll(/\s(\d+)w(?:,|$)/g)].map(m=>Number(m[1]));
  const expected=Math.max(...widths);
  if(!Number.isFinite(expected)||size.width!==expected||Math.max(size.width,size.height)<=400||size.width>12000||size.height>12000)throw Error('Wrong original dimensions; not the evidenced full-size image');
  return size;
}
let browser,decoder;
async function decode(bytes,size){
  if(!decoder){const {getChromium,discoverBrowser}=require('../../../factory/qa/browser');browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,args:['--no-sandbox']});decoder=await browser.newPage();await decoder.route('**/*',route=>route.abort());}
  const actual=await decoder.evaluate(async data=>{const image=new Image();image.src=data;await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image decode timeout')),5000))]);return{width:image.naturalWidth,height:image.naturalHeight};},'data:image/jpeg;base64,'+bytes.toString('base64'));
  if(actual.width!==size.width||actual.height!==size.height)throw Error('Decoded image dimensions disagree');
}
async function main(args){
  const value=flag=>args[args.indexOf(flag)+1];
  const output=path.resolve(args.includes('--output')?value('--output'):'.factory-cache/live/collegium-balticum/migration/gallery-originals');
  if(args.includes('--import')){
    fs.mkdirSync(output,{recursive:true});const staging=fs.mkdtempSync(path.join(output,'.verify-'));
    try{
      unzip(value('--import'),staging);const m=verify(staging,config);
      if(m.kind!=='cb-gallery-originals'||m.gallerySourceHash!==sourceHash)throw Error('Wrong provenance');
      const report=JSON.parse(fs.readFileSync(path.join(staging,'gallery.json')));
      if(report.length!==21||new Set(report.map(r=>r.sourceUrl)).size!==21)throw Error('Incomplete gallery manifest');
      for(const r of report){const item=source.originals.find(i=>i.sourceUrl===r.sourceUrl);if(!item)throw Error('URL outside allowlist');if(r.status==='DONE'){
        if(!m.files.some(f=>f.path===r.file))throw Error('Unmanifested image');const bytes=fs.readFileSync(path.join(staging,r.file));if(sha(bytes)!==r.sha256||bytes.length!==r.bytes)throw Error('Image integrity failed');await decode(bytes,validate(bytes,item,r.contentType));
      }}
      const dest=path.join(output,sha(fs.readFileSync(path.join(staging,'manifest.json'))).slice(0,16));
      if(fs.existsSync(dest)){verify(dest,config);fs.rmSync(staging,{recursive:true});}else fs.renameSync(staging,dest);
      const readable=dir=>{fs.chmodSync(dir,0o755);for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())readable(file);else fs.chmodSync(file,0o644);}};readable(dest);
      const repository=path.resolve(__dirname,'../../../..'),relative=path.relative(repository,dest);
      if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Import destination must be in repository cache');
      fs.writeFileSync(path.join(repository,'.factory-cache/live/collegium-balticum/migration/gallery-ready.json'),JSON.stringify({bundle:relative,manifestSha256:sha(fs.readFileSync(path.join(dest,'manifest.json')))}));
      console.log(JSON.stringify({directory:dest,downloaded:report.filter(r=>r.status==='DONE').length,blocked:report.filter(r=>r.status!=='DONE').length}));return;
    }catch(e){fs.rmSync(staging,{recursive:true,force:true});throw e;}
  }
  if(!args.includes('--download'))throw Error('Use --download or --import ZIP, optionally --output DIR');
  if(source.originals.length!==21||new Set(source.originals.map(i=>i.sourceUrl)).size!==21)throw Error('Invalid source allowlist');
  if(fs.existsSync(output))throw Error('Output exists; preserve earlier evidence');fs.mkdirSync(path.join(output,'files'),{recursive:true});
  const allowed=new Set(source.originals.map(i=>i.sourceUrl)),report=[];
  for(const item of source.originals){const r={sourceUrl:item.sourceUrl,thumbnailSource:item.thumbnailSource,status:'BLOCKED',httpStatus:null,finalUrl:null,bytes:null,contentType:null,sha256:null};
    try{
      let url=item.sourceUrl,response;const signal=AbortSignal.timeout(30000);
      for(let hops=0;hops<=5;hops++){
        if(!allowed.has(url)||new URL(url).protocol!=='https:')throw Error('Redirect outside exact HTTPS allowlist');
        response=await fetch(url,{redirect:'manual',signal});
        r.httpStatus=response.status;r.finalUrl=url;r.contentType=response.headers.get('content-type');
        if(response.status>=300&&response.status<400&&response.headers.get('location')){if(hops===5)throw Error('Redirect limit');url=new URL(response.headers.get('location'),url).href;}else break;
      }
      if(!response.ok)throw Error('HTTP '+response.status);
      if(Number(response.headers.get('content-length')||0)>25*1024*1024)throw Error('Size limit');
      const chunks=[];let count=0;for await(const chunk of response.body){count+=chunk.length;if(count>25*1024*1024)throw Error('Size limit');chunks.push(chunk);}
      const bytes=Buffer.concat(chunks);r.bytes=bytes.length;r.sha256=sha(bytes);const size=validate(bytes,item,r.contentType);await decode(bytes,size);const hash=sha(bytes),file='files/'+hash+'.jpg';fs.writeFileSync(path.join(output,file),bytes);
      Object.assign(r,{status:'DONE',bytes:count,sha256:hash,file,...size});
    }catch(e){r.error=e.message;r.errorType=e.name;if(e.cause?.code)r.networkErrorCode=e.cause.code;}
    report.push(r);console.log(r.status,r.sourceUrl,r.error||r.bytes);await new Promise(resolve=>setTimeout(resolve,250));
  }
  fs.writeFileSync(path.join(output,'gallery.json'),JSON.stringify(report,null,2));
  manifest(output,{project:config.project,sourceUrl:config.sourceUrl,configHash:sha(Buffer.from(JSON.stringify(config))),gallerySourceHash:sourceHash,sourceHtmlSha256:source.sourceHtmlSha256,kind:'cb-gallery-originals',records:[],runner:process.env.GITHUB_ACTIONS==='true'?{kind:'github-actions',repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA}:{kind:'standalone'},status:report.every(r=>r.status==='DONE')?'DONE':'BLOCKED',at:new Date().toISOString()});
  zip(output,output+'.zip');if(report.some(r=>r.status!=='DONE'))process.exitCode=1;
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{await browser?.close();});
module.exports={dimensions,validate};
