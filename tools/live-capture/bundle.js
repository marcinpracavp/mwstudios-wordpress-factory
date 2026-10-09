const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function safe(name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.includes('\0') || name.split('/').some(x => !x || x === '.' || x === '..') || path.isAbsolute(name) || /^[a-z]:/i.test(name)) throw Error('UNSAFE_PATH');
  return name;
}
function files(root, prefix = '') {
  return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(e => {
    if (e.isSymbolicLink()) throw Error('SYMLINK_NOT_ALLOWED');
    const name = prefix ? prefix+'/'+e.name : e.name;
    return e.isDirectory() ? files(root,name) : [safe(name)];
  });
}
function manifest(root, metadata) {
  const entries = files(root).filter(name=>name!=='manifest.json').sort().map(name=>{
    const bytes=fs.readFileSync(path.join(root,name));return {path:name,bytes:bytes.length,sha256:sha(bytes)};
  });
  const value={schemaVersion:1,...metadata,files:entries};
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(value,null,2)+'\n');return value;
}
function verify(root, config) {
  const value=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
  if(value.schemaVersion!==1||value.project!==config.project||value.sourceUrl!==config.sourceUrl||value.configHash!==sha(Buffer.from(JSON.stringify(config)))) throw Error('WRONG_PROVENANCE');
  if(!Array.isArray(value.files)||!Array.isArray(value.records)||value.files.length>30000)throw Error('INVALID_MANIFEST');
  const declared=new Map();
  for(const entry of value.files){safe(entry.path);if(declared.has(entry.path)||entry.path==='manifest.json')throw Error('DUPLICATE_PATH');declared.set(entry.path,entry);const bytes=fs.readFileSync(path.join(root,entry.path));if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)throw Error('HASH_MISMATCH: '+entry.path);}
  if(files(root).some(name=>name!=='manifest.json'&&!declared.has(name)))throw Error('UNDECLARED_FILE');
  const allowed=new Set(config.routes.map(r=>r.id));const keys=new Set();
  for(const record of value.records){const key=record.id+'/'+record.viewport;if(!allowed.has(record.id)||!['desktop','mobile'].includes(record.viewport)||keys.has(key)||!['DONE','BLOCKED'].includes(record.status))throw Error('INVALID_RECORD');keys.add(key);
    if(record.url!==config.sourceUrl+config.routes.find(r=>r.id===record.id).path)throw Error('WRONG_RECORD_URL');
    if(record.status==='DONE'){
      if(!record.identity?.valid||![new URL(config.sourceUrl).hostname,new URL(config.sourceUrl).hostname.replace(/^www\./,'')].includes(new URL(record.finalUrl).hostname))throw Error('UNVERIFIED_IDENTITY');
      for(const name of ['screenshot','html','dom','resources','layout','metrics'])if(!record.paths?.[name]||!declared.has(safe(record.paths[name])))throw Error('MISSING_EVIDENCE: '+name);
      const png=fs.readFileSync(path.join(root,record.paths.screenshot));const width=record.viewport==='desktop'?1440:390;
      const metrics=JSON.parse(fs.readFileSync(path.join(root,record.paths.metrics)));
      // Native fullPage may include source overflow. Accept it only when the
      // independently captured viewport and overflow metrics explain every pixel.
      const pngWidth=png.readUInt32BE(16);
      const explainedOverflow=(metrics.viewportWidth===width||metrics.documentElementClientWidth===width)&&metrics.horizontalOverflow===true&&Math.ceil(metrics.scrollWidth)===pngWidth&&pngWidth>width&&pngWidth<=width*2;
      if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||(pngWidth!==width&&!explainedOverflow)||png.readUInt32BE(20)<(record.viewport==='desktop'?900:844))throw Error('INVALID_SCREENSHOT');
      const html=fs.readFileSync(path.join(root,record.paths.html),'utf8');if(!/<(?:html|body)\b/i.test(html)||/please wait while your request is being verified|verify you are human/i.test(html.replace(/<script[\s\S]*?<\/script>/gi,'')))throw Error('INVALID_HTML');
      const resources=JSON.parse(fs.readFileSync(path.join(root,record.paths.resources)));for(const resource of resources.assets||[]){if(!/^https?:/.test(resource.url)||resource.file&&!declared.has(safe(resource.file)))throw Error('INVALID_RESOURCE');}
    }
  }
  return value;
}
const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function zip(root, output) {
  const chunks=[],central=[];let offset=0;
  for(const name of files(root)){const bytes=fs.readFileSync(path.join(root,name)),label=Buffer.from(name),compressed=zlib.deflateRawSync(bytes);const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt32LE(crc(bytes),14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(label.length,26);chunks.push(local,label,compressed);const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt32LE(crc(bytes),16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(bytes.length,24);entry.writeUInt16LE(label.length,28);entry.writeUInt32LE(offset,42);central.push(entry,label);offset+=local.length+label.length+compressed.length;}
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(central.length/2,8);end.writeUInt16LE(central.length/2,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);fs.writeFileSync(output,Buffer.concat([...chunks,directory,end]));
}
function unzip(input, output) {
  const bytes=fs.readFileSync(input);if(bytes.length>512*1024*1024)throw Error('ZIP_TOO_LARGE');let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
  if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6)||bytes.readUInt16LE(end+8)!==bytes.readUInt16LE(end+10))throw Error('INVALID_ZIP');
  let count=bytes.readUInt16LE(end+10),directoryOffset=bytes.readUInt32LE(end+16);
  if(count===65535||directoryOffset===0xffffffff){
    if(end<20||bytes.readUInt32LE(end-20)!==0x07064b50)throw Error('INVALID_ZIP64');
    const offset=Number(bytes.readBigUInt64LE(end-12));
    if(!Number.isSafeInteger(offset)||offset<0||offset+56>bytes.length||bytes.readUInt32LE(offset)!==0x06064b50)throw Error('INVALID_ZIP64');
    count=Number(bytes.readBigUInt64LE(offset+32));directoryOffset=Number(bytes.readBigUInt64LE(offset+48));
  }
  if(!Number.isSafeInteger(count)||count>30000||!Number.isSafeInteger(directoryOffset)||directoryOffset>=end)throw Error('INVALID_DIRECTORY_LIMIT');let pos=directoryOffset,total=0;const seen=new Set(),entries=[];
  for(let i=0;i<count;i++){
    if(bytes.readUInt32LE(pos)!==0x02014b50)throw Error('INVALID_DIRECTORY');const flags=bytes.readUInt16LE(pos+8),method=bytes.readUInt16LE(pos+10),packed=bytes.readUInt32LE(pos+20),size=bytes.readUInt32LE(pos+24),len=bytes.readUInt16LE(pos+28),extra=bytes.readUInt16LE(pos+30),comment=bytes.readUInt16LE(pos+32),offset=bytes.readUInt32LE(pos+42);const name=bytes.subarray(pos+46,pos+46+len).toString('utf8');const mode=bytes.readUInt32LE(pos+38)>>>16;
    if(flags&1||![0,8].includes(method)||(mode&0xf000)===0xa000||size>100*1024*1024||(total+=size)>1024*1024*1024)throw Error('UNSAFE_ZIP_ENTRY');
    if(name.endsWith('/')){safe(name.slice(0,-1));pos+=46+len+extra+comment;continue;}safe(name);if(seen.has(name))throw Error('DUPLICATE_ZIP_PATH');seen.add(name);
    if(bytes.readUInt32LE(offset)!==0x04034b50)throw Error('INVALID_LOCAL_HEADER');const localNameLength=bytes.readUInt16LE(offset+26);if(bytes.subarray(offset+30,offset+30+localNameLength).toString('utf8')!==name)throw Error('ZIP_HEADER_NAME_MISMATCH');const start=offset+30+localNameLength+bytes.readUInt16LE(offset+28);if(start+packed>directoryOffset)throw Error('INVALID_ZIP_OFFSET');const compressed=bytes.subarray(start,start+packed);const data=method===8?zlib.inflateRawSync(compressed,{maxOutputLength:Math.max(1,size)}):compressed;if(data.length!==size||crc(data)!==bytes.readUInt32LE(pos+16))throw Error('ZIP_CRC_MISMATCH');entries.push({name,data});pos+=46+len+extra+comment;
  }
  fs.mkdirSync(output,{recursive:true});for(const {name,data}of entries){const destination=path.join(output,name);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,data,{flag:'wx'});}return entries.length;
}
module.exports={sha,safe,files,manifest,verify,zip,unzip};
