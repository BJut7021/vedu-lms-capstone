import {mkdirSync,writeFileSync} from 'node:fs';
const folder=new URL('../frontend/public/images/brands/',import.meta.url);
mkdirSync(folder,{recursive:true});
for(const name of ['word','excel','powerpoint']){
 const url=`https://static2.sharepointonline.com/files/fabric/assets/brand-icons/product/svg/${name}_48x1.svg`;
 const response=await fetch(url);
 if(!response.ok)throw Error(`${name}: ${response.status}`);
 const svg=await response.text();
 if(!svg.includes('<svg')||svg.includes('<script'))throw Error('Unexpected brand asset');
 writeFileSync(new URL(`${name}.svg`,folder),svg);
 console.log(name,svg.length,'bytes; Microsoft product icon');
}
