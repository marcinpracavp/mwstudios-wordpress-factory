const fs=require('fs'),path=require('path');
const file=path.join(process.cwd(),'.factory-cache/figma/latest/sections/10-checkout-customer-details.json');
const section=JSON.parse(fs.readFileSync(file,'utf8'));
section.layout={...section.layout,designContextRead:true,type:'native-commerce-checkout-customer-details'};
section.typography=section.typography||[];
section.notes=(section.notes||[]).filter(note=>!note.includes('Exact typography'));
section.notes.push('Visual geometry, form control styling, and exact native field labels were verified with Figma design context node 492:716.');
section.liveFigmaRequired=false;
fs.writeFileSync(file,`${JSON.stringify(section,null,2)}\n`);
