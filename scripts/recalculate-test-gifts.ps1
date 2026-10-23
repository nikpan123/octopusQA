param([ValidateSet('School','Form')][string]$Action,[int]$SchoolId,[string]$SchoolName,[int]$UserId,[int]$TeacherId,[int]$OrderId=0,[int]$FormId=0)
$transaction=$null
if($SchoolName -cnotmatch '^(?:AUTO_CAT_DEV_ENT_UNMARKED_(SP|TECH)_(400|8|MISSING)_(PRIMARY|SECOND)_POTW26_[a-f0-9]{12}_P\d+_W\d+|AUTO_CAT_D_P26_[a-f0-9]{12})$'){throw 'NOT_PACKAGE_SCHOOL'}
if($SchoolId -le 0 -or $TeacherId -le 0 -or $UserId -le 0 -or ($Action -eq 'School' -and $OrderId -le 0) -or ($Action -eq 'Form' -and $FormId -le 0)){throw 'INVALID_ID'}
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$connection = $null
$reader = $null
$command = $null
$stage = 'configuration'
try {
  Add-Type -AssemblyName System.Data
  if ($env:OCTOPUS_ENV -and $env:OCTOPUS_ENV -ne 'dev') { throw 'DEV_ONLY' }
  if ($env:OCTOPUS_DEV_DB_NAME -ne 'GWO_CRMDEV') { throw 'DEV_DATABASE_REQUIRED' }
  foreach ($key in @('OCTOPUS_DEV_DB_SERVER', 'OCTOPUS_DEV_DB_USER', 'OCTOPUS_DEV_DB_PASSWORD')) {
    if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($key))) { throw 'MISSING_CONFIGURATION' }
  }
  $port = 1433
  if ($env:OCTOPUS_DEV_DB_PORT) { $port = [int]$env:OCTOPUS_DEV_DB_PORT }
  if ($port -lt 1 -or $port -gt 65535) { throw 'INVALID_PORT' }


  $builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
  $builder['Data Source'] = "$($env:OCTOPUS_DEV_DB_SERVER),$port"
  $builder['Initial Catalog'] = $env:OCTOPUS_DEV_DB_NAME
  $builder['User ID'] = $env:OCTOPUS_DEV_DB_USER
  $builder['Password'] = $env:OCTOPUS_DEV_DB_PASSWORD
  $builder['Integrated Security'] = $false
  $builder['Encrypt'] = $env:OCTOPUS_DEV_DB_ENCRYPT -ne 'false'
  $builder['TrustServerCertificate'] = $env:OCTOPUS_DEV_DB_TRUST_SERVER_CERTIFICATE -eq 'true'
  $builder['Connect Timeout'] = 10
  $builder['Application Name'] = 'Octopus QA own POTW26 recalculation'

  $connection = New-Object System.Data.SqlClient.SqlConnection($builder.get_ConnectionString())
  $stage = 'connect'
  $connection.Open()
  $command = $connection.CreateCommand()
  $stage = 'read'
  $command.CommandTimeout = 10
  $command.CommandText = 'SELECT DB_NAME()'
  $database = [string]$command.ExecuteScalar()
  if ($database -ne 'GWO_CRMDEV') { throw 'WRONG_DATABASE' }


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
} catch {
  if ($transaction) { try { $transaction.Rollback() } catch {} }
  # Nie wypisujemy exception.Message ani connection stringa: mogą zawierać sekrety.
  $exception = $_.Exception
  $text = $exception.ToString()
  $kind = 'connection'
  if ($text -match 'DEV_ONLY|DEV_DATABASE_REQUIRED|WRONG_DATABASE') { $kind = 'database_guard' }
  elseif ($text -match 'MISSING_CONFIGURATION|INVALID_PORT|INVALID_ID') { $kind = 'configuration' }
  elseif ($text -match 'certificate|certyfikat|trust chain|principal name') { $kind = 'certificate' }
  elseif ($text -match '18456|Login failed|4060') { $kind = 'authentication' }
  $number = $null
  if ($exception.InnerException -and $exception.InnerException.PSObject.Properties['Number']) { $number = $exception.InnerException.Number }
  elseif ($exception.PSObject.Properties['Number']) { $number = $exception.Number }
  @{ error = @{ kind = $kind; number = $number; stage = $stage; type = $exception.GetType().FullName; line = $_.InvocationInfo.ScriptLineNumber } } | ConvertTo-Json -Compress
  exit 1
} finally {
  if ($reader) { $reader.Dispose() }
  if ($command) { $command.Dispose() }
  if ($connection) { $connection.Dispose() }
}
