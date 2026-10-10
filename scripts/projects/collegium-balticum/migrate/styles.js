/** Scoped adaptation of captured public CSS. No trackers, remote fonts or plugins. */
const fs=require('fs'),path=require('path'),postcss=require('postcss'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../../..'),data=JSON.parse(fs.readFileSync(path.join(root,'.factory-cache/live/collegium-balticum/migration/source.json'))),out=postcss.root();
const fonts=path.join(root,'assets/fonts/cb');fs.mkdirSync(fonts,{recursive:true});
const images=data.assets.filter(a=>a.type==='image'),fontAssets=data.assets.filter(a=>a.type==='font');
function rewrite(value){return value.replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(match,q,url)=>{if(url.startsWith('data:'))return match;const base=path.basename(url),font=fontAssets.find(a=>path.basename(new URL(a.url).pathname)===base);if(font){const name=font.sha256+'.woff2';fs.copyFileSync(font.path,path.join(fonts,name));return 'url("../../assets/fonts/cb/'+name+'")';}const image=images.find(a=>a.url===url||path.basename(new URL(a.url).pathname)===base);if(image)return 'var(--cb-asset-'+crypto.createHash('sha256').update(image.url).digest('hex').slice(0,12)+')';return 'none';});}
const evidence=require('../../../../docs/projects/collegium-balticum/capture-3c/references-evidence.json');
const sourceSheets=data.assets.filter(a=>a.type==='stylesheet' && /(?:nitrocdn\.com|cb\.szczecin\.pl)/.test(a.url) && !['c1ca933','7f55b3','28e390'].some(x=>a.sha256.startsWith(x)));
const sheetPages=new Map();for(const row of evidence.rows)for(const view of row.views)for(const asset of JSON.parse(fs.readFileSync(view.paths.resources)).assets||[]){if(!sheetPages.has(asset.url))sheetPages.set(asset.url,new Set());sheetPages.get(asset.url).add(row.id.toLowerCase());}
// All client scopes have identical specificity. Page membership must not make
// a captured base rule stronger than the source's later inline override.
const scopeFor=ids=>{
  if(ids.length===data.pages.length)return '.cb-site';
  // Shared source rules use the shorter complement, with the same specificity
  // and identical membership for every required CB view.
  const excluded=data.pages.map(p=>p.id.toLowerCase()).filter(id=>!ids.includes(id));
  return ids.length>excluded.length?'.cb-site:where(:not('+excluded.map(id=>'.cb-view-'+id).join(',')+'))':'.cb-site:where('+ids.map(id=>'.cb-view-'+id).join(',')+')';
};
const inline=new Map();for(const page of data.pages)for(const text of new Set(page.inlineStyles||[])){if(!inline.has(text))inline.set(text,[]);inline.get(text).push(page.id.toLowerCase());}
// Nitro's rendered head contains the 400/600 faces. The body-only content
// extractor intentionally omits that head; recover only captured Poppins faces.
const headFonts=new Set();
for(const row of evidence.rows)for(const view of row.views){
 const html=fs.readFileSync(view.paths.html,'utf8');
 for(const face of html.match(/@font-face\s*\{[^}]*\}/g)||[])if(/font-family:\s*["']?Poppins/.test(face))headFonts.add(face);
}
const sheets=[...sourceSheets.map(a=>({text:fs.readFileSync(a.path,'utf8'),scope:scopeFor([...(sheetPages.get(a.url)||[])])})),...[...inline].map(([text,ids])=>({text,scope:scopeFor(ids)})),{text:[...headFonts].join('\n'),scope:'.cb-site'}];
for(const {text,scope} of sheets){const sheet=postcss.parse(text);sheet.walkComments(c=>c.remove());sheet.walkAtRules(a=>{if(/keyframes/.test(a.name)||a.name==='import')a.remove();if(a.name==='font-face' && !a.toString().includes('Poppins'))a.remove();});sheet.walkRules(rule=>{
if(rule.parent?.name?.includes('keyframes'))return;
const selectors=rule.selectors.filter(s=>!/(\.tos-|\.on[eE]tap|\.wpcf7-spinner|\.animated|\.fadeIn|\.loader|\.wow\b|\.hamburger--(?!squeeze))/.test(s));if(!selectors.length){rule.remove();return;}
rule.selectors=selectors.map(s=>{s=s.replace(/^:root\s+/, '').replace(/\.container\b/g,'.l-container').replace(/(^|[ >+~])main\b/g,'$1.cb-content');if(/^html\b|^:root\b/.test(s))return s.replace(/^html\b|^:root\b/,'html:has('+scope+')');if(/^body\b/.test(s))return s.replace(/^body\b/,scope);return scope+' '+s;});
});sheet.walkDecls(d=>{if(d.prop==='font-family'&&d.value.includes('Poppins'))d.value=d.value.replace(/Poppins/g,'CBPoppins');if(d.value.includes('url('))d.value=rewrite(d.value);d.important=false;});sheet.walkAtRules(a=>{if(a.name==='font-face' && a.toString().includes('src:none'))a.remove();});sheet.walkRules(r=>r.raws.before='\n');out.append(sheet.nodes);}
fs.writeFileSync(path.join(root,'src/css/components/_collegium-balticum-source.scss'),out.toString());
