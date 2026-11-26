// Recover byte-identical duplicate files in the portable project export.
import {readFile, mkdir, copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
const within = value => {
 const file = path.resolve(root, value);
 if (!file.startsWith(root + path.sep)) throw Error('Invalid resource path');
 return file;
};
const entries = JSON.parse(await readFile(path.join(root, 'shared-assets.json'), 'utf8'));
for (const entry of entries) {
 const source = within(entry.source), target = within(entry.target);
 await mkdir(path.dirname(target), {recursive:true});
 try { await copyFile(source, target, constants.COPYFILE_EXCL); }
 catch (error) { if (error.code !== 'EEXIST') throw error; }
}
console.log('Shared assets are ready.');
