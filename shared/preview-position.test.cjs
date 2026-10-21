const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {readPreviewPosition,savePreviewPosition}=require('./preview-position.cjs');
test('położenie przechodzi między procesami testów i odrzuca nieprawidłowe wartości',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qa-position-check-')),file=path.join(directory,'position.json');
 try{
  assert.equal(await readPreviewPosition(file),null);
  assert.equal(await savePreviewPosition({left:40,top:470},file),true);
  const output=execFileSync(process.execPath,['-e',"require(process.argv[1]).readPreviewPosition(process.argv[2]).then(v=>process.stdout.write(JSON.stringify(v)))",require.resolve('./preview-position.cjs'),file],{encoding:'utf8'});
  assert.deepEqual(JSON.parse(output),{left:40,top:470});
  assert.equal(await savePreviewPosition({left:NaN,top:20},file),false);
  assert.deepEqual(await readPreviewPosition(file),{left:40,top:470});
 }finally{assert.equal(path.dirname(directory),path.resolve(os.tmpdir()));await fs.rm(directory,{recursive:true,force:true});}
});
