import{readFileSync,writeFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{loadEnvFile}from'node:process';import{resolveOrderDatePowerShell}from'../scripts/test-order-date.mjs';
const s=readFileSync('scripts/read-gift-catalog.ps1','utf8');
const prefix=s.slice(s.indexOf('$ErrorActionPreference'),s.indexOf("  if ($Action -eq 'Probe') {"));
const suffix=s.slice(s.indexOf('} catch {'));
const body=`$command.CommandText = @'
SELECT N'parameter' AS kind,o.name AS objectName,p.name AS fieldName,ty.name AS typeName FROM sys.procedures o JOIN sys.parameters p ON p.object_id=o.object_id JOIN sys.types ty ON ty.user_type_id=p.user_type_id WHERE o.name IN ('RecalculateSchoolClassDigitalAccessesBasedOnSchoolId','SendBookFromFormClubPSChangesStates')
UNION ALL
SELECT N'column',t.name,c.name,ty.name FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE t.name LIKE '%FormClub%'
'@
$reader=$command.ExecuteReader()
$rows=@()
while($reader.Read()) { $rows+=@{kind=[string]$reader['kind'];objectName=[string]$reader['objectName'];fieldName=[string]$reader['fieldName'];typeName=[string]$reader['typeName']} }
@{database=$database;rows=@($rows)}|ConvertTo-Json -Depth 5 -Compress
`;
writeFileSync('.artifact_build/gift-procedure-probe.ps1','\uFEFF'+prefix+body+suffix);
loadEnvFile('.env');console.log(execFileSync(resolveOrderDatePowerShell(),['-NoProfile','-File','.artifact_build/gift-procedure-probe.ps1'],{encoding:'utf8',windowsHide:true}));
