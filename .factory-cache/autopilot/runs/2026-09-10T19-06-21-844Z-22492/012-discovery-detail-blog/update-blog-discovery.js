const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '../../../../../');
const snapshot = path.join(root, '.factory-cache/figma/latest');
const manifestPath = path.join(snapshot, 'manifest.json');
const contentMapPath = path.join(snapshot, 'content-map.json');
const sectionsDir = path.join(snapshot, 'sections');
const sectionReferences = path.join(snapshot, 'references/sections');
const assetDir = path.join(snapshot, 'assets/blog');
const planPath = path.join(root, 'docs/factory/project/PLAN.md');
const clarificationPath = path.join(root, 'docs/factory/project/SOURCE_CLARIFICATIONS.md');
const project = 'rudnikagro';

function own(nodeId) { return { project, sourceNodeId: nodeId }; }
function field(section, nodeId, fieldName, type, value, destination) {
  return { section, nodeId, fieldName: `rudnikagro_${fieldName}`, type, language: 'pl', value, destination, ownership: own(nodeId) };
}
function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeJson(p, value) { fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function addOnce(text, marker, addition) { return text.includes(marker) ? text : `${text.replace(/\s*$/, '')}\n\n${addition.trim()}\n`; }
function download(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'MWStudios Website Factory Autopilot' } }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        return download(new URL(response.headers.location, url).toString(), file).then(resolve, reject);
      }
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`GET ${url}: HTTP ${response.statusCode}`)); }
      const temp = `${file}.tmp`;
      const out = fs.createWriteStream(temp);
      response.pipe(out);
      out.on('finish', () => out.close(() => { fs.renameSync(temp, file); resolve(); }));
      out.on('error', error => { try { fs.unlinkSync(temp); } catch {} reject(error); });
    });
    request.on('error', reject);
    request.setTimeout(30000, () => request.destroy(new Error(`GET ${url}: timeout`)));
  });
}

const assets = [
  ['blog-article-banner-327-3287.png', 'https://www.figma.com/api/mcp/asset/5c7c5fb8-d162-4b18-8a46-4d9bcc509fd2.png', '327:3287'],
  ['blog-article-hero-327-3359.png', 'https://www.figma.com/api/mcp/asset/062e8f03-388f-4b56-970c-e02169b82b17.png', '327:3359'],
  ['blog-related-327-3302.png', 'https://www.figma.com/api/mcp/asset/135c4cf2-7dc3-4015-aaea-f8c38d0af705.png', '327:3302'],
  ['blog-related-327-3303.png', 'https://www.figma.com/api/mcp/asset/c2926d4d-b349-4ee0-a4fe-4afe500061f7.png', '327:3303'],
  ['blog-related-327-3304.png', 'https://www.figma.com/api/mcp/asset/f43787a8-4836-4835-a650-aab1e5d6f6b0.png', '327:3304'],
  ['blog-related-arrow-327-3295.svg', 'https://www.figma.com/api/mcp/asset/2a7c7895-3fd9-4801-8889-b9a0ee9a824f.svg', '327:3295'],
  ['blog-archive-banner-327-3097.png', 'https://www.figma.com/api/mcp/asset/5c7c5fb8-d162-4b18-8a46-4d9bcc509fd2.png', '327:3097'],
  ['blog-archive-327-3116.png', 'https://www.figma.com/api/mcp/asset/2cd45bec-6118-4550-b5f3-3d4d5fffa36e.png', '327:3116'],
  ['blog-archive-327-3117.png', 'https://www.figma.com/api/mcp/asset/41620390-78cb-4564-82f7-602bcffb32ab.png', '327:3117'],
  ['blog-archive-327-3118.png', 'https://www.figma.com/api/mcp/asset/001bf6f7-7540-4912-9a3a-cd9f17412074.png', '327:3118'],
  ['blog-archive-327-3137.png', 'https://www.figma.com/api/mcp/asset/68f7334f-8346-48fe-ab50-71588900467e.png', '327:3137'],
  ['blog-archive-327-3138.png', 'https://www.figma.com/api/mcp/asset/bec0acf2-b340-4c9b-a17f-fba12b6e522f.png', '327:3138'],
  ['blog-archive-327-3139.png', 'https://www.figma.com/api/mcp/asset/8f151c68-f8f3-4c24-a58c-e5e1a2c38072.png', '327:3139'],
  ['blog-archive-327-3154.png', 'https://www.figma.com/api/mcp/asset/d1603b98-e3d7-486a-bb7d-5e38f911b1e9.png', '327:3154'],
  ['blog-archive-327-3155.png', 'https://www.figma.com/api/mcp/asset/025d8736-7dd8-4fdf-8c03-2ae688531752.png', '327:3155'],
  ['blog-archive-327-3156.png', 'https://www.figma.com/api/mcp/asset/585233c0-50dd-42aa-92d4-11be50a4530c.png', '327:3156'],
  ['blog-archive-327-3172.png', 'https://www.figma.com/api/mcp/asset/3600fa13-2470-4342-b71a-13fe7abb1161.png', '327:3172'],
  ['blog-archive-327-3173.png', 'https://www.figma.com/api/mcp/asset/95a2f6f3-dddd-4a69-ae65-c8655d455526.png', '327:3173'],
  ['blog-archive-327-3174.png', 'https://www.figma.com/api/mcp/asset/db228e91-cf23-4539-91e3-b63a2236d7e2.png', '327:3174'],
  ['blog-pagination-next-422-41.svg', 'https://www.figma.com/api/mcp/asset/587ac8fb-a8a7-4837-9e15-1d0ba7760e62.svg', '422:41']
];
const localAsset = filename => `assets/blog/${filename}`;

const posts = [
  ['327:3116', 'Popularne nawozy potasowe i ich zastosowanie w uprawach', '10 lipca 2025'],
  ['327:3117', 'Jak nawozić rzepak, kukurydzę, buraki, warzywa?', '10 lipca 2025'],
  ['327:3118', 'Nawozy dolistne, pod korzeń i do fertygacji – jak poprawić efektywność nawożenia?', '23 czerwca 2025'],
  ['327:3137', 'Nawozy otoczkowane i długo działające – innowacje w nawożeniu roślin', '26 czerwca 2025'],
  ['327:3138', 'Nawozy NPK, PK i azotowe – jak wybrać odpowiedni nawóz dla Twoich upraw?', '27 maja 2025'],
  ['327:3139', 'Skracanie pszenicy – kiedy warto wykonać zabieg i jakie są jego korzyści?', '27 maja 2025'],
  ['327:3154', 'Ochrona pszenicy ozimej przed chwastami – jak skutecznie walczyć z miotłą zbożową?', '15 kwietnia 2025'],
  ['327:3155', 'Jakie fungicydy są najbardziej efektywne w ochronie rzepaku przed grzybami?', '15 kwietnia 2025'],
  ['327:3156', 'Zaprawy nasienne – kluczowe czynniki wpływające na zdrowy wzrost roślin', '27 marca 2025'],
  ['327:3172', 'Opryski herbicydowe – wpływ warunków atmosferycznych na skuteczność zabiegów', '15 kwietnia 2025'],
  ['327:3173', 'Jak poprawnie stosować regulatory wzrostu w rzepaku?', '10 lipca 2025'],
  ['327:3174', 'Insektycydy – czy można mieszać je z innymi środkami ochrony roślin?', '23 czerwca 2025']
].map(([nodeId, title, date]) => ({ nodeId, title, date, label: 'Czytaj całość', image: localAsset(`blog-archive-${nodeId.replace(':', '-')}.png`), destination: null }));

const articleHtml = `<p>Potas jest jednym z najważniejszych składników odżywczych, które rośliny potrzebują do prawidłowego wzrostu i rozwoju. Odpowiednia ilość potasu wpływa na jakość plonu, zwiększa odporność roślin na choroby oraz stresy środowiskowe, takie jak susza czy mróz. Wśród nawozów potasowych dostępnych na rynku wyróżniamy kilka popularnych rodzajów, które różnią się składem i zastosowaniem. Poniżej przedstawiamy najczęściej stosowane nawozy potasowe oraz ich zastosowanie w różnych uprawach, wraz z przykładami produktów dostępnych w sklepie Rudnik Agro.</p><h2>Najpopularniejsze nawozy potasowe</h2><h3>Chlorek potasu (KCl)</h3><p>Chlorek potasu to najczęściej stosowany nawóz potasowy o wysokiej zawartości potasu (około 60% K₂O). Jest stosunkowo tani i skuteczny, jednak jego wadą jest obecność chlorków, które mogą być szkodliwe dla roślin wrażliwych na ten składnik, takich jak buraki cukrowe czy niektóre warzywa.</p><p>W sklepie Rudnik Agro nie oferujemy osobno chlorku potasu, ale znajdziesz nawozy wieloskładnikowe z potasem, które mogą być bezpieczniejszą alternatywą.</p><h3>Siarczan potasu (K₂SO₄)</h3><p>Siarczan potasu zawiera około 50% potasu oraz siarkę – dodatkowy składnik odżywczy. Jest idealny do upraw wrażliwych na chlorki, jak buraki cukrowe, warzywa, rośliny strączkowe oraz rośliny oleiste.</p><h3>Azotan potasu (KNO₃)</h3><p>Azotan potasu to nawóz dwuskładnikowy, zawierający potas i azot w formie azotanowej, co zapewnia szybkie i efektywne działanie. Jest często stosowany w uprawach warzyw, owoców i roślin ozdobnych, szczególnie w uprawach szklarniowych.</p><h2>Przykłady nawozów potasowych i wieloskładnikowych z potasem w sklepie Rudnik Agro</h2><p><a href="https://sklep.rudnikagro.pl/pl/p/DELTACOTE-AGRI-11-10-20-4CaO-5MgO-worek-25kg/1401" target="_blank">DELTACOTE AGRI 11-10-20+4CaO+5MgO (25 kg)</a><br>Nawóz wieloskładnikowy z wysoką zawartością potasu (20% K₂O), wapnia i magnezu. Doskonały do kukurydzy, buraków i innych upraw wymagających solidnego wsparcia potasem.</p><p><a href="https://sklep.rudnikagro.pl/pl/p/DELTACOTE-CONTROL-14-07-20-2MgO-TE-worek-25kg/1399" target="_blank">DELTACOTE CONTROL 14-07-20+2MgO+TE (25 kg)</a><br>Kompleksowy nawóz z potasem i mikroelementami, przeznaczony do precyzyjnego nawożenia warzyw oraz buraków, szczególnie wrażliwych na niedobory potasu.</p><p><a href="https://sklep.rudnikagro.pl/pl/p/DELTACOTE-RAPES-16-08-18-3%2C5MgO-3%2C5-CaO-1-tona/1419" target="_blank">DELTACOTE RAPES 16-08-18+3,5MgO+3,5CaO (1 tona)</a><br>Specjalistyczny nawóz dedykowany pod rzepak, bogaty w potas, azot, fosfor, magnez i wapń, który wspomaga rozwój i zwiększa odporność roślin.</p><p><a href="https://sklep.rudnikagro.pl/pl/p/AQUAFERT-15-30-15-MIKRO-worek-25kg/131" target="_blank">AQUAFERT 15-30-15 + MIKRO (25 kg)</a><br>Nawóz z wysoką zawartością fosforu i potasu, idealny do stosowania pod warzywa i kukurydzę.</p><h2>Zastosowanie nawozów potasowych w uprawach</h2><ul><li><strong>Zboża i kukurydza:</strong> Potas pomaga w tworzeniu silnych źdźbeł i wpływa na wypełnienie ziarna, co przekłada się na większe plony.</li><li><strong>Buraki cukrowe:</strong> Potas jest niezbędny dla wysokiej zawartości cukru i prawidłowego rozwoju korzenia.</li><li><strong>Warzywa:</strong> Dzięki potasowi warzywa zyskują lepszy smak, dłuższą trwałość oraz atrakcyjny wygląd.</li><li><strong>Rzepak:</strong> Potas wspomaga kwitnienie, zawiązywanie nasion oraz odporność na suszę.</li></ul><p>Nawozy potasowe odgrywają niezwykle ważną rolę w prawidłowym nawożeniu roślin. Wybór odpowiedniego nawozu zależy od rodzaju uprawy i specyfiki gleby. W sklepie Rudnik Agro znajdziesz szeroką ofertę nawozów wieloskładnikowych z wysoką zawartością potasu, takich jak DELTACOTE AGRI, DELTACOTE CONTROL czy DELTACOTE RAPES, które pomogą Ci skutecznie nawozić Twoje uprawy i osiągać lepsze plony.</p>`;

function assetFor(nodeId) { const a = assets.find(item => item[2] === nodeId); return a ? localAsset(a[0]) : null; }
function section(id, name, order, nodeId, rect, reference, layout, contentFields, assetNodeIds, typography, colors, notes) {
  return {
    id, name, order,
    source: { pageId: '0:1', desktopNodeId: nodeId },
    desktop: { frameWidth: 1920, ...rect, containerWidth: 1440, padding: { left: 240, right: 240 } },
    layout: { type: 'source-composition', productionFrame: rect.productionFrame, designContextRead: true, nodes: layout },
    typography, colors, effects: [], contentFields,
    assets: assetNodeIds.map(sourceNodeId => ({ sourceNodeId, path: assetFor(sourceNodeId), usage: 'Exact Figma MCP export; crop/geometry recorded in this section.' })),
    notes, liveFigmaRequired: false
  };
}
const node = (id, name, type, x, y, width, height) => ({ id, name, type, parentId: null, bounds: { x, y, width, height }, visible: true });
const sectionDefinitions = [
  section('blog-article-heading', 'Article heading', 35, '327:3357', { x: 200, y: 219, width: 1520, height: 1114, productionFrame: '327:3176' }, 'references/sections/blog-article-heading.png', [node('327:3287','Banner','RECTANGLE',240,219,1440,150),node('327:3288','Blog','TEXT',898,219,123,150),node('327:3177','Breadcrumb','TEXT',240,369,634,70),node('327:3357','Article title','TEXT',240,456,1434,121),node('327:3359','Hero image','RECTANGLE',240,610,1440,641),node('327:3371','Publication date','TEXT',240,1251,149,87)], ['breadcrumb','banner_label','title','featured_image','publication_date'], ['327:3287','327:3359'], [{ nodeId:'327:3357',fontFamily:'DM Sans',weight:700,size:48,lineHeight:55 },{ nodeId:'327:3288',fontFamily:'DM Sans',weight:700,size:48,lineHeight:24 }], ['#056839'], ['Exact full-frame crop: x=200,y=219,width=1520,height=1114 from references/full/frame-327-3176.png.', 'Breadcrumb destination URLs are absent from source.']),
  section('blog-article-content', 'Article content', 36, '327:3358', { x: 200, y: 1333, width: 1520, height: 1090, productionFrame: '327:3176' }, 'references/sections/blog-article-content.png', [node('327:3358','Article WYSIWYG','TEXT',240,1333,1440,1025),node('431:929','Return button','GROUP',240,2379,286,44)], ['content','return_label'], [], [{ nodeId:'327:3358',fontFamily:'DM Sans',bodySize:18,bodyLineHeight:24,headingSize:24,weight:'400/700' }], ['#000000','#056839'], ['Exact full-frame crop: x=200,y=1333,width=1520,height=1090 from references/full/frame-327-3176.png.', 'Four product links are sourced directly in WYSIWYG content.']),
  section('blog-related-posts', 'Related posts', 37, '327:3356', { x: 200, y: 2532, width: 1520, height: 645, productionFrame: '327:3176' }, 'references/sections/blog-related-posts.png', [node('327:3367','Section heading','TEXT',240,2532,467,55),node('327:3356','Related post card','GROUP',240,2610,467,545),node('327:3355','Related post card','GROUP',727,2610,467,545),node('327:3289','Related post card','GROUP',1213,2610,481,545)], ['heading','posts'], ['327:3302','327:3303','327:3304','327:3295'], [{ nodeId:'327:3367',fontFamily:'DM Sans',weight:700,size:32,lineHeight:55 },{ nodeId:'327:3290',fontFamily:'DM Sans',weight:700,size:32 }], ['#000000','#056839'], ['Exact full-frame crop: x=200,y=2532,width=1520,height=645 from references/full/frame-327-3176.png.', 'Related-card destinations are not represented by source links.']),
  section('blog-archive-heading', 'Blog archive heading', 38, '327:3098', { x: 200, y: 219, width: 1520, height: 220, productionFrame: '327:2986' }, 'references/sections/blog-archive-heading.png', [node('327:3097','Banner','RECTANGLE',240,219,1440,150),node('327:3098','Blog','TEXT',898,219,123,150),node('327:2987','Breadcrumb','TEXT',240,369,508,70)], ['banner_label','breadcrumb'], ['327:3097'], [{ nodeId:'327:3098',fontFamily:'DM Sans',weight:700,size:48,lineHeight:24 }], ['#056839'], ['Exact full-frame crop: x=200,y=219,width=1520,height=220 from references/full/frame-327-2986.png.', 'Breadcrumb destination URLs are absent from source.']),
  section('blog-post-list', 'Blog post list', 39, '327:3103', { x: 200, y: 478, width: 1520, height: 2444, productionFrame: '327:2986' }, 'references/sections/blog-post-list.png', [node('327:3103','Blog card row 1','GROUP',240,478,1454,545),node('327:3124','Blog card row 2','GROUP',240,1098,1454,545),node('327:3141','Blog card row 3','GROUP',240,1718,1454,584),node('327:3159','Blog card row 4','GROUP',240,2377,1454,545)], ['posts'], posts.map(post => post.nodeId), [{ nodeId:'327:3104',fontFamily:'DM Sans',weight:700,size:32 },{ nodeId:'327:3105',fontFamily:'DM Sans',weight:400,size:16 },{ nodeId:'327:3108',fontFamily:'DM Sans',weight:700,size:18 }], ['#000000','#056839'], ['Exact full-frame crop: x=200,y=478,width=1520,height=2444 from references/full/frame-327-2986.png.', 'Desktop source is a 3-column 12-item card grid, 467px image height 315px and 30px corner radius.']),
  section('blog-pagination', 'Blog pagination', 40, '422:25', { x: 700, y: 2940, width: 520, height: 100, productionFrame: '327:2986' }, 'references/sections/blog-pagination.png', [node('422:25','Pagination','GROUP',796,2978,348,40)], ['current_page','page_labels','next_label'], ['422:41'], [{ nodeId:'422:34',fontFamily:'DM Sans',weight:400,size:14,lineHeight:34 }], ['#93c01f','#c8c8c8','#aaaaaa','#ffffff'], ['Exact full-frame crop: x=700,y=2940,width=520,height=100 from references/full/frame-327-2986.png.', 'Source shows pages 1–7 and a next-chevron; pagination destination/state behavior is not captured.'])
];

function makeCrops() {
  const crops = [
    ['frame-327-3176.png','blog-article-heading',200,219,1520,1114,'blog-article-heading.png'],
    ['frame-327-3176.png','blog-article-content',200,1333,1520,1090,'blog-article-content.png'],
    ['frame-327-3176.png','blog-related-posts',200,2532,1520,645,'blog-related-posts.png'],
    ['frame-327-2986.png','blog-archive-heading',200,219,1520,220,'blog-archive-heading.png'],
    ['frame-327-2986.png','blog-post-list',200,478,1520,2444,'blog-post-list.png'],
    ['frame-327-2986.png','blog-pagination',700,2940,520,100,'blog-pagination.png']
  ];
  mkdir(sectionReferences);
  for (const [source, label, x, y, width, height, destination] of crops) {
    execFileSync('node', ['scripts/factory/autopilot/image-preview.js', `.factory-cache/figma/latest/references/full/${source}`, label, String(x), String(y), String(width), String(height)], { cwd: root, stdio: 'pipe' });
    fs.copyFileSync(path.join(root,'.factory-cache/autopilot/previews',`${label}.png`), path.join(sectionReferences,destination));
  }
}

async function main() {
  mkdir(assetDir);
  await Promise.all(assets.map(([filename, url]) => download(url, path.join(assetDir, filename))));
  makeCrops();
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const records = [
    field('blog-article-heading','327:3177','blog_article_heading_breadcrumb','text','Strona główna / Blog / Popularne nawozy potasowe i ich zastosowanie w uprawach','ACF post fields / Article header tab'),
    field('blog-article-heading','327:3288','blog_article_heading_banner_label','text','Blog','ACF post fields / Article header tab'),
    field('blog-article-heading','327:3357','blog_article_heading_title','text','Popularne nawozy potasowe i ich zastosowanie w uprawach','WordPress post title'),
    field('blog-article-heading','327:3359','blog_article_heading_featured_image','image',localAsset('blog-article-hero-327-3359.png'),'WordPress featured image'),
    field('blog-article-heading','327:3371','blog_article_heading_publication_date','text','10 lipca 2025','WordPress post date'),
    field('blog-article-content','327:3358','blog_article_content','wysiwyg',articleHtml,'WordPress post content'),
    field('blog-article-content','431:931','blog_article_return_label','text','Wróć do wszystkich wpisów','ACF post fields / Article content tab'),
    field('blog-related-posts','327:3367','blog_related_posts_heading','text','Pozostałe wpisy','ACF post fields / Related posts tab'),
    field('blog-related-posts','327:3356','blog_related_posts_items','repeater',[
      { title:'Popularne nawozy potasowe i ich zastosowanie w uprawach',date:'10 lipca 2025',label:'Czytaj całość',image:localAsset('blog-related-327-3302.png'),destination:null },
      { title:'Jak nawozić rzepak, kukurydzę, buraki, warzywa?',date:'10 lipca 2025',label:'Czytaj całość',image:localAsset('blog-related-327-3303.png'),destination:null },
      { title:'Nawozy dolistne, pod korzeń i do fertygacji – jak poprawić efektywność nawożenia?',date:'23 czerwca 2025',label:'Czytaj całość',image:localAsset('blog-related-327-3304.png'),destination:null }
    ],'ACF post fields / Related posts tab'),
    field('blog-archive-heading','327:3098','blog_archive_heading_banner_label','text','Blog','ACF archive options / Blog header tab'),
    field('blog-archive-heading','327:2987','blog_archive_heading_breadcrumb','text','Strona główna / Blog','ACF archive options / Blog header tab'),
    field('blog-post-list','327:3103','blog_post_list_items','repeater',posts,'Native WordPress posts (title, date, featured image; source card destinations unavailable)'),
    field('blog-pagination','422:25','blog_pagination','pagination',{current:1,pages:['1','2','3','4','5','6','7'],next:'next'},'Native WordPress pagination')
  ];
  const map = JSON.parse(fs.readFileSync(contentMapPath, 'utf8'));
  map.fields = map.fields.filter(item => !item.ownership || item.ownership.project !== project || !item.section.startsWith('blog-'));
  map.fields.push(...records);
  const sectionIds = new Set(sectionDefinitions.map(item => item.id));
  manifest.sections = manifest.sections.filter(item => !sectionIds.has(item.id));
  manifest.sections.push(...sectionDefinitions.map(item => ({ id:item.id,name:item.name,order:item.order,pageId:'0:1',snapshot:`sections/${item.order}-${item.id}.json`,desktopNodeId:item.source.desktopNodeId,desktopReference:item.desktopReference || `references/sections/${item.id}.png` })));
  manifest.frames = manifest.frames.filter(item => !sectionDefinitions.some(section => section.source.desktopNodeId === item.nodeId));
  manifest.frames.push(...sectionDefinitions.map(item => ({ nodeId:item.source.desktopNodeId,name:item.name,pageId:'0:1',type:item.layout.nodes[0].type,viewport:'desktop',language:'pl' })));
  for (const route of manifest.routes) {
    if (route.id === 'blog-article') Object.assign(route.sectionGeometry, { 'blog-article-heading':{x:200,y:219,width:1520,height:1114},'blog-article-content':{x:200,y:1333,width:1520,height:1090},'blog-related-posts':{x:200,y:2532,width:1520,height:645} });
    if (route.id === 'blog-archive') Object.assign(route.sectionGeometry, { 'blog-archive-heading':{x:200,y:219,width:1520,height:220},'blog-post-list':{x:200,y:478,width:1520,height:2444},'blog-pagination':{x:700,y:2940,width:520,height:100} });
  }
  for (const entry of sectionDefinitions) writeJson(path.join(sectionsDir, `${entry.order}-${entry.id}.json`), entry);
  writeJson(manifestPath, manifest);
  writeJson(contentMapPath, map);
  const planBlock = `<!-- factory-blog-discovery -->
## Blog — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Article header | blog_article_heading_banner_label, blog_article_heading_breadcrumb | Text | text | Post: blog article |
| Article header | native post title, featured image, publish date | Native WordPress | post values | Post: blog article |
| Article content | native post content | WYSIWYG | HTML | Post: blog article |
| Article content | blog_article_return_label | Text | text | Post: blog article |
| Related posts | blog_related_posts_heading | Text | text | Post: blog article |
| Related posts | blog_related_posts_items | Relationship | post IDs, source selection recorded | Post: blog article |
| Archive header | blog_archive_heading_banner_label, blog_archive_heading_breadcrumb | Text | text | Blog archive options |
| Archive cards | native posts | Native WordPress | title, date, featured image | Blog post collection |

The archive source supplies visible card labels, dates and images but no card destination URLs; implementation will bind those cards to native WordPress permalinks rather than inventing source links. The source article uses four explicit external product links inside its WYSIWYG content; retain their exact captured URLs. Responsive behavior is derived because no mobile source is present.`;
  const clarifyBlock = `<!-- factory-blog-source-clarifications -->
## Blog discovery gaps

- The Figma archive and related-post cards expose the label “Czytaj całość” but no destination URLs. Bind to native WordPress post permalinks during implementation; do not claim those paths came from Figma.
- The source pagination shows pages 1–7 plus a next chevron, but it supplies no interaction/reaction or page destinations. Use native WordPress pagination behavior.
- Article breadcrumb and return-button destination URLs are absent from Figma. Use site-local archive hierarchy during implementation and mark it as an implementation decision.
- Mobile blog designs are absent; responsive behavior is derived, not a claimed Figma match.`;
  fs.writeFileSync(planPath, addOnce(fs.readFileSync(planPath,'utf8'),'<!-- factory-blog-discovery -->',planBlock),'utf8');
  fs.writeFileSync(clarificationPath, addOnce(fs.readFileSync(clarificationPath,'utf8'),'<!-- factory-blog-source-clarifications -->',clarifyBlock),'utf8');
  console.log(JSON.stringify({sections:sectionDefinitions.map(item=>item.id),assets:assets.length,records:records.length},null,2));
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
