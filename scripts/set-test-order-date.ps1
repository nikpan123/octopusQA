param([int]$OrderId,[int]$SchoolId,[int]$UserId,[string]$SchoolName,[string]$Date,[ValidateSet('potw26','new-client-history')][string]$Purpose='potw26')
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
$connection=$null
$transaction=$null
$stage='configuration'
try {
  if(($env:OCTOPUS_ENV -and $env:OCTOPUS_ENV -ne 'dev') -or $env:OCTOPUS_DEV_DB_NAME -ne 'GWO_CRMDEV'){throw 'DEV_ONLY'}
  if($OrderId -le 0 -or $SchoolId -le 0 -or $UserId -le 0){throw 'INVALID_ID'}
  if($Purpose -eq 'potw26') {
    if($SchoolName -cnotmatch '^(?:AUTO_CAT_DEV_ENT_UNMARKED_(SP|TECH)_(400|8|MISSING)_(PRIMARY|SECOND)_POTW26_[a-f0-9]{12}_P\d+_W\d+|AUTO_CAT_D_P26_[a-f0-9]{12})$'){throw 'NOT_PACKAGE_SCHOOL'}
  } else {
    if($SchoolName -cnotmatch '^AUTO_CAT_D_NCL4_[a-f0-9]{12}$'){throw 'NOT_NCL04_SCHOOL'}
  }
  $requested=[datetime]::ParseExact($Date,'yyyy-MM-dd',[Globalization.CultureInfo]::InvariantCulture).AddHours(12)
  Add-Type -AssemblyName System.Data
  $builder=New-Object System.Data.SqlClient.SqlConnectionStringBuilder
  $dbPort = if ($env:OCTOPUS_DEV_DB_PORT) { $env:OCTOPUS_DEV_DB_PORT } else { '1433' }
  $builder['Data Source']="$($env:OCTOPUS_DEV_DB_SERVER),$dbPort"
  $builder['Initial Catalog']='GWO_CRMDEV'
  $builder['User ID']=$env:OCTOPUS_DEV_DB_USER
  $builder['Password']=$env:OCTOPUS_DEV_DB_PASSWORD
  $builder['Encrypt']=$env:OCTOPUS_DEV_DB_ENCRYPT -ne 'false'
  $builder['TrustServerCertificate']=$env:OCTOPUS_DEV_DB_TRUST_SERVER_CERTIFICATE -eq 'true'
  $builder['Connect Timeout']=10
  $builder['Application Name']='Octopus QA own POTW26 order date'
  $connection=New-Object System.Data.SqlClient.SqlConnection($builder.get_ConnectionString())
  $stage='connect'
  $connection.Open()
  $transaction=$connection.BeginTransaction()
  $command=$connection.CreateCommand()
  $command.Transaction=$transaction
  $command.CommandTimeout=15
  $command.CommandText=@'
IF DB_NAME() <> N'GWO_CRMDEV' THROW 51000, 'WRONG_DATABASE', 1;
IF (SELECT COUNT(*) FROM dbo.SchoolOrder o WITH (UPDLOCK,HOLDLOCK)
    JOIN dbo.School s ON s.Id=o.SchoolId
    WHERE o.Id=@orderId AND o.SchoolId=@schoolId AND s.Name=@schoolName
      AND o.CreatedBy=@userId AND o.IsDel=0 AND o.IsCopied=0
      AND (ISNULL(o.CmsOrderSymbol,N'')=N'' OR o.CmsOrderSymbol LIKE N'[12][0-9][0-9][0-9]/BOK/'+CONVERT(nvarchar(20),@orderId))
      AND (ISNULL(o.SalesOrderSymbol,N'')=N'' OR o.SalesOrderSymbol LIKE N'[12][0-9][0-9][0-9]/BOK/'+CONVERT(nvarchar(20),@orderId))) <> 1
  THROW 51001, 'NOT_OWN_MANUAL_ORDER', 1;
UPDATE dbo.SchoolOrder SET CreatedAt=@date WHERE Id=@orderId AND SchoolId=@schoolId;
IF @@ROWCOUNT <> 1 THROW 51002, 'UNEXPECTED_ROW_COUNT', 1;
SELECT CreatedAt FROM dbo.SchoolOrder WHERE Id=@orderId AND SchoolId=@schoolId;
'@
  [void]$command.Parameters.Add('@orderId',[Data.SqlDbType]::Int);$command.Parameters['@orderId'].Value=$OrderId
  [void]$command.Parameters.Add('@schoolId',[Data.SqlDbType]::Int);$command.Parameters['@schoolId'].Value=$SchoolId
  [void]$command.Parameters.Add('@userId',[Data.SqlDbType]::Int);$command.Parameters['@userId'].Value=$UserId
  [void]$command.Parameters.Add('@schoolName',[Data.SqlDbType]::NVarChar,300);$command.Parameters['@schoolName'].Value=$SchoolName
  [void]$command.Parameters.Add('@date',[Data.SqlDbType]::DateTime2);$command.Parameters['@date'].Value=$requested
  $stage='update-owned-date'
  $saved=[datetime]$command.ExecuteScalar()
  if($saved.Date -ne $requested.Date){throw 'DATE_NOT_SAVED'}
  $transaction.Commit();$transaction=$null
  @{orderId=$OrderId;schoolId=$SchoolId;date=$saved.ToString('yyyy-MM-dd')}|ConvertTo-Json -Compress
} catch {
  if($transaction){$transaction.Rollback()}
  [Console]::Error.WriteLine('POTW26 stage='+$stage+'; type='+$_.Exception.GetType().Name+'; sqlNumber='+$_.Exception.InnerException.Number)
  exit 1
} finally {if($connection){$connection.Dispose()}}
