// Validates a Mission 2 handoff ZIP and copies its model into the site.
//   npm run import-model                    uses handoff/Venture_3D_Confirmed_Handoff.zip
//   npm run import-model -- path/to/file.zip
// Nothing is copied unless every check passes.
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {strFromU8, unzipSync} from 'fflate';
import validator from 'gltf-validator';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const zipPath = resolve(process.argv[2] ?? join(root, 'handoff', 'Venture_3D_Confirmed_Handoff.zip'));
const outDir = join(root, 'public', 'media', '3d');
const REQUIRED = ['model.glb', 'model-manifest.json', 'project.json', 'preview.png', 'README.txt'];
const SUPPORTED = /^venture3d\.handoff\/1\.\d+$/;

const problems = [];
const fail = (msg) => problems.push(msg);
const sha = (b) => createHash('sha256').update(b).digest('hex');

let files;
try {
  files = unzipSync(new Uint8Array(readFileSync(zipPath)));
} catch (err) {
  console.error(`Could not open ${zipPath}: ${err.message}`);
  console.error('Export a new handoff with Confirm Model in the Venture 3D Studio (Mission 2).');
  process.exit(1);
}

for (const name of REQUIRED) if (!files[name]?.length) fail(`Missing ${name}`);
if (problems.length) report();

const manifest = JSON.parse(strFromU8(files['model-manifest.json']));
if (!SUPPORTED.test(manifest.schemaVersion ?? '')) fail(`Unsupported manifest schema "${manifest.schemaVersion}"`);

const glb = files['model.glb'];
const checks = [['model.glb', 'model'], ['project.json', 'project'], ['preview.png', 'preview']];
for (const [file, key] of checks) {
  const expected = manifest.files?.[key]?.sha256;
  if (expected && sha(files[file]) !== expected) fail(`${file} does not match its checksum in the manifest`);
}

const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) fail('model.glb is not a glTF 2.0 binary file');
const json = JSON.parse(Buffer.from(glb.subarray(20, 20 + view.getUint32(12, true))).toString());
const external = [...(json.images ?? []), ...(json.buffers ?? [])].filter((x) => x.uri);
if (external.length) fail('model.glb links to outside files, so it would break on the website');
const report2 = await validator.validateBytes(glb, {uri: 'model.glb', maxIssues: 20});
if (report2.issues.numErrors) fail(`model.glb has ${report2.issues.numErrors} glTF validation errors`);

const d = manifest.dimensions;
if (!d || d.unit !== 'cm' || ![d.width, d.height, d.depth].every((n) => Number.isFinite(n) && n > 0)) fail('Dimensions are missing or not in centimetres');
const meshes = (json.nodes ?? []).filter((n) => n.mesh !== undefined).length;
if (manifest.stats?.meshes !== undefined && meshes !== manifest.stats.meshes) fail(`model.glb has ${meshes} parts, but the manifest lists ${manifest.stats.meshes}`);
if (glb.byteLength > 15 * 1024 * 1024) fail(`model.glb is ${(glb.byteLength / 1048576).toFixed(1)} MB, too large for a fast website`);

report();

function report() {
  if (problems.length) {
    console.error(`Handoff rejected (${zipPath}):\n - ${problems.join('\n - ')}`);
    console.error('Nothing was changed. Confirm the model again in Mission 2 and export a fresh ZIP.');
    process.exit(1);
  }
}

mkdirSync(outDir, {recursive: true});
writeFileSync(join(outDir, 'model.glb'), glb);
writeFileSync(join(outDir, 'model-manifest.json'), files['model-manifest.json']);
writeFileSync(join(outDir, 'preview.png'), files['preview.png']);
console.log(`Imported "${manifest.modelName}" version ${manifest.modelVersion}, confirmed ${manifest.confirmedAt}`);
console.log(`  ${d.width} x ${d.height} x ${d.depth} cm, ${meshes} parts, ${(glb.byteLength / 1024).toFixed(0)} KB`);
console.log(`  glTF validator: ${report2.issues.numErrors} errors, ${report2.issues.numWarnings} warnings`);
console.log(`  Copied model.glb, model-manifest.json and preview.png to public/media/3d/`);
