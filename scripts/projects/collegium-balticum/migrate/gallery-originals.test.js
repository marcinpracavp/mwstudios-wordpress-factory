const {test}=require('node:test'),assert=require('node:assert/strict');
const {dimensions,validate}=require('./gallery-originals');
const frame=(w,h)=>{const b=Buffer.from('ffd8ffc00008080000000001ffd9','hex');b.writeUInt16BE(h,7);b.writeUInt16BE(w,9);return b;};
test('rejects verification HTML even with JPEG MIME',()=>assert.throws(()=>validate(Buffer.from('<html>Please wait</html>'),{srcset:'https://example.invalid/full.jpg 1200w'},'image/jpeg')));
test('rejects thumbnail and unexpected MIME',()=>{assert.throws(()=>validate(frame(300,200),{srcset:'x 300w, y 1200w'},'image/jpeg'));assert.throws(()=>validate(frame(1200,800),{srcset:'x 1200w'},'text/html'));});
test('accepts only dimensions evidenced by full-size srcset',()=>assert.deepEqual(validate(frame(1200,800),{srcset:'x 300w, y 1200w'},'image/jpeg'),{width:1200,height:800}));
