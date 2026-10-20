const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{randomUUID}=require('node:crypto');
const defaultFile=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.config'),'CentrumTestow','preview-position.json');
const valid=value=>value&&Number.isFinite(value.left)&&Number.isFinite(value.top)&&Math.abs(value.left)<100000&&Math.abs(value.top)<100000;
async function readPreviewPosition(file=defaultFile){try{const value=JSON.parse(await fs.readFile(file,'utf8'));return valid(value)?{left:value.left,top:value.top}:null;}catch{return null;}}
async function savePreviewPosition(value,file=defaultFile){
 if(!valid(value))return false;
 const temporary=file+'.'+randomUUID()+'.tmp';
 try{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(temporary,JSON.stringify({left:value.left,top:value.top}),'utf8');await fs.rename(temporary,file);return true;}
 catch{try{await fs.unlink(temporary);}catch{}return false;}
}
module.exports={readPreviewPosition,savePreviewPosition};
