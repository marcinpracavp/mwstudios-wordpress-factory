const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
test('verified image raster noise is separated; unverified assets, colour changes and borders remain failures',async()=>{
  const {discoverBrowser,getChromium}=require('../qa/browser');
  const browser=await getChromium().launch({executablePath:discoverBrowser().browser.executablePath,headless:true});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'factory-noise-test-'));
  try{
    const page=await browser.newPage();
    const png=async(kind)=>{
      const data=await page.evaluate(kind=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');
        const image=ctx.createImageData(100,100);for(let y=0;y<100;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;
          const value=kind==='noise'?128+((x+y)%2?30:-30):kind==='wrong'?190:128;image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;}
        ctx.putImageData(image,0,0);return c.toDataURL();},kind);
      const file=path.join(dir,kind+'.png');fs.writeFileSync(file,Buffer.from(data.split(',')[1],'base64'));return file;
    };
    const reference=await png('reference'),noise=await png('noise'),wrong=await png('wrong');
    const image={loaded:true,width:100,height:100,x:0,y:0,sourceIdentityVerified:true};
    const compare=async(file,verified)=>require('./visual').compareImages(page,reference,file,{channelTolerance:24},[],[{...image,sourceIdentityVerified:verified}]);
    const verified=await compare(noise,true),unknown=await compare(noise,false),bad=await compare(wrong,true);
    assert.equal(verified.ratio,1);assert.ok(verified.ownership.page.layoutRatio<.2);assert.ok(verified.ownership.page.layoutRatio>0,'Four-pixel border is still checked');
    assert.equal(unknown.ownership.page.layoutRatio,1);assert.equal(bad.ownership.page.layoutRatio,1);
  }finally{await browser.close();if(path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('factory-noise-test-'))fs.rmSync(dir,{recursive:true});}
});
