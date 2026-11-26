import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {transform} from 'esbuild';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ORIGINAL='6e01f9a77e3c3b2e4a4d9705445de343cd26a606';
const digest=value=>createHash('sha256').update(value).digest('hex');
const old=execFileSync('git',['show',ORIGINAL+':dist/style.css'],{encoding:'utf8'}),current=await readFile('dist/style.css','utf8');
async function canonical(css){
 const ast=postcss.parse(css),palette=new Map();
 ast.walkDecls(decl=>{if(!decl.prop.startsWith('--dwc-color-'))return;assert.equal(decl.parent.selector,':root');assert(!palette.has(decl.prop),'Palette tokens have one root definition');palette.set(decl.prop,decl.value);});
 ast.walkRules(rule=>{if(rule.selector===':root'&&rule.nodes.every(n=>n.type==='decl'&&n.prop.startsWith('--dwc-color-')))rule.remove();});
 ast.walkDecls(decl=>{if(decl.value.includes('var(--dwc-color-'))assert(!/["']|url\(/i.test(decl.value),'Palette substitutions stay outside strings and URLs');decl.value=decl.value.replace(/var\((--dwc-color-[a-z-]+)\)/g,(_,token)=>{assert(palette.has(token));return palette.get(token);});});
 return {code:(await transform(ast.toString(),{loader:'css',minifyWhitespace:true,minifySyntax:false,minifyIdentifiers:false,target:'esnext',legalComments:'none'})).code,palette:palette.size};
}
const a=await canonical(old),b=await canonical(current);
const result={baselineCommit:ORIGINAL,baselineBytes:Buffer.byteLength(old),currentBytes:Buffer.byteLength(current),paletteTokens:b.palette,baselineCanonicalSha256:digest(a.code),currentCanonicalSha256:digest(b.code),equal:a.code===b.code,browserVerified:false};
await mkdir('qa/results',{recursive:true});await writeFile('qa/results/style-preservation.json',JSON.stringify(result,null,2)+'\n');
assert.equal(b.code,a.code,'All existing selectors, layers, media conditions, declaration order and literal values remain equivalent after palette expansion');
console.log(JSON.stringify(result));
