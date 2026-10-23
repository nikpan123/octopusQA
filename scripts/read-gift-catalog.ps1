param([ValidateSet('Probe','Read')][string]$Action = 'Probe', [int]$GiftId = 0)
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

  if ($Action -eq 'Probe') {
    $command.CommandText = "SELECT t.name AS tableName,c.name AS columnName FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id WHERE t.name LIKE '%OrderItem%' ORDER BY t.name,c.column_id"
  } else {
    if ($GiftId -le 0) { throw 'INVALID_ID' }
    $command.CommandText = @'
SELECT g.Id AS id,g.Title AS title,g.BusinessCode AS businessCode,g.PromotionCode AS promotionCode,g.Weight AS weight,g.IsDel AS isDel,
 (SELECT s.SubjectId AS subjectId FROM dbo.OrderItemSubject s WHERE s.DictOrderItemId=g.Id ORDER BY s.SubjectId FOR JSON PATH) AS subjects,
 (SELECT c.Class AS class,c.LevelId AS levelId FROM dbo.OrderItemClass c WHERE c.DictOrderItemId=g.Id ORDER BY c.Class,c.LevelId FOR JSON PATH) AS classes
FROM dbo.DictOrderItem g WHERE g.Id=@GiftId
'@
    [void]$command.Parameters.Add('@GiftId',[System.Data.SqlDbType]::Int)
    $command.Parameters['@GiftId'].Value=$GiftId
  }
  $reader = $command.ExecuteReader()
  $rows = @()
  while ($reader.Read()) {
    $row = @{}
    for ($i=0; $i -lt $reader.FieldCount; $i++) { $row[$reader.GetName($i)] = if ($reader.IsDBNull($i)) { $null } else { $reader.GetValue($i) } }
    $rows += $row
  }
  @{ database = $database; rows = @($rows) } | ConvertTo-Json -Depth 6 -Compress
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
