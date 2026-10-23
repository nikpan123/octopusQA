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
  $builder['Application Name'] = 'Octopus QA read-only SchoolOrder'
  $builder['ApplicationIntent'] = 'ReadOnly'
  $connection = New-Object System.Data.SqlClient.SqlConnection($builder.get_ConnectionString())
  $stage = 'connect'
  $connection.Open()
  $command = $connection.CreateCommand()
  $stage = 'read'
  $command.CommandTimeout = 10
  $command.CommandText = 'SELECT DB_NAME()'
  $database = [string]$command.ExecuteScalar()
  if ($database -ne 'GWO_CRMDEV') { throw 'WRONG_DATABASE' }

$command.CommandText = @'
SELECT N'header' AS kind,o.name AS objectName,LEFT(OBJECT_DEFINITION(o.object_id),1000) AS fieldName,N'definition' AS typeName FROM sys.procedures o WHERE o.name IN ('RecalculateSchoolClassDigitalAccessesBasedOnSchoolId','SendBookFromFormClubPSChangesStates') UNION ALL SELECT N'parameter' AS kind,o.name AS objectName,p.name AS fieldName,ty.name AS typeName FROM sys.procedures o JOIN sys.parameters p ON p.object_id=o.object_id JOIN sys.types ty ON ty.user_type_id=p.user_type_id WHERE o.name IN ('RecalculateSchoolClassDigitalAccessesBasedOnSchoolId','SendBookFromFormClubPSChangesStates')
UNION ALL
SELECT N'column',t.name,c.name,ty.name FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE t.name LIKE '%FormClub%'
'@
$reader=$command.ExecuteReader()
$rows=@()
while($reader.Read()) { $rows+=@{kind=[string]$reader['kind'];objectName=[string]$reader['objectName'];fieldName=[string]$reader['fieldName'];typeName=[string]$reader['typeName']} }
@{database=$database;rows=@($rows)}|ConvertTo-Json -Depth 5 -Compress
} catch {
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
