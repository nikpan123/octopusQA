import {readFileSync,writeFileSync} from 'node:fs';
const header=`param([ValidateSet('School','Form')][string]$Action,[int]$SchoolId,[string]$SchoolName,[int]$UserId,[int]$TeacherId,[int]$OrderId=0,[int]$FormId=0)
$transaction=$null
if($SchoolName -cnotmatch '^(?:AUTO_CAT_DEV_ENT_UNMARKED_(SP|TECH)_(400|8|MISSING)_(PRIMARY|SECOND)_POTW26_[a-f0-9]{12}_P\\d+_W\\d+|AUTO_CAT_D_P26_[a-f0-9]{12})$'){throw 'NOT_PACKAGE_SCHOOL'}
if($SchoolId -le 0 -or $TeacherId -le 0 -or $UserId -le 0 -or ($Action -eq 'School' -and $OrderId -le 0) -or ($Action -eq 'Form' -and $FormId -le 0)){throw 'INVALID_ID'}
`;
const body=`
  $transaction=$connection.BeginTransaction()
  $command.Transaction=$transaction
  $command.CommandTimeout=40
  $command.CommandText=@'
IF DB_NAME() <> N'GWO_CRMDEV' THROW 51000, 'WRONG_DATABASE', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.School WITH (UPDLOCK,HOLDLOCK) WHERE Id=@schoolId AND Name=@schoolName)
 THROW 51001, 'NOT_PACKAGE_SCHOOL', 1;
'@
  [void]$command.Parameters.Add('@schoolId',[Data.SqlDbType]::Int);$command.Parameters['@schoolId'].Value=$SchoolId
  [void]$command.Parameters.Add('@schoolName',[Data.SqlDbType]::NVarChar,300);$command.Parameters['@schoolName'].Value=$SchoolName
  [void]$command.Parameters.Add('@userId',[Data.SqlDbType]::Int);$command.Parameters['@userId'].Value=$UserId
  [void]$command.Parameters.Add('@teacherId',[Data.SqlDbType]::Int);$command.Parameters['@teacherId'].Value=$TeacherId
  if ($Action -eq 'School') {
    [void]$command.Parameters.Add('@orderId',[Data.SqlDbType]::Int);$command.Parameters['@orderId'].Value=$OrderId
    $command.CommandText+=@'

IF NOT EXISTS (SELECT 1 FROM dbo.SchoolOrder WITH (UPDLOCK,HOLDLOCK)
 WHERE Id=@orderId AND SchoolId=@schoolId AND CreatedBy=@userId AND IsDel=0 AND IsCopied=0)
 THROW 51002, 'NOT_OWN_ORDER', 1;
EXEC dbo.RecalculateSchoolClassDigitalAccessesBasedOnSchoolId @schoolId=@schoolId, @updatedBy=@userId;
'@
    $targetId=$OrderId
  } else {
    [void]$command.Parameters.Add('@formId',[Data.SqlDbType]::Int);$command.Parameters['@formId'].Value=$FormId
    $command.CommandText+=@'

IF NOT EXISTS (SELECT 1 FROM dbo.FormClub f WITH (UPDLOCK,HOLDLOCK)
 WHERE f.Id=@formId AND f.TeacherId=@teacherId AND f.CreatedBy=@userId AND f.IsDel=0)
 OR NOT EXISTS (SELECT 1 FROM dbo.FormClubClass WHERE FormClubId=@formId AND SchoolId=@schoolId)
 OR EXISTS (SELECT 1 FROM dbo.FormClubClass WHERE FormClubId=@formId AND SchoolId<>@schoolId)
 THROW 51003, 'NOT_OWN_FORM', 1;
EXEC dbo.SendBookFromFormClubPSChangesStates @ClubFormId=@formId;
'@
    $targetId=$FormId
  }
  $stage='recalculate-owned-data'
  [void]$command.ExecuteNonQuery()
  $transaction.Commit();$transaction=$null
  @{database=$database;action=$Action;schoolId=$SchoolId;teacherId=$TeacherId;targetId=$targetId}|ConvertTo-Json -Compress
`;
writeFileSync('scripts/recalculate-test-gifts.ps1','\uFEFF'+header+readFileSync('.artifact_build/recalculation-prefix.txt','utf8')+body+readFileSync('.artifact_build/recalculation-suffix.txt','utf8'));
