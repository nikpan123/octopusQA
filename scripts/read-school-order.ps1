param(
  [ValidateSet('Probe', 'ReadOrder')][string]$Action = 'Probe',
  [int]$OrderId = 0,
  [int]$SchoolId = 0
)

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
  if ($Action -eq 'ReadOrder' -and ($OrderId -le 0 -or $SchoolId -le 0)) { throw 'INVALID_ID' }

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
    $command.CommandText = @'
SELECT s.name AS SchemaName, c.name AS ColumnName, ty.name AS TypeName
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE s.name = N'dbo' AND t.name = N'SchoolOrder'
ORDER BY c.column_id
'@
    $reader = $command.ExecuteReader()
    $columns = @()
    while ($reader.Read()) {
      $columns += @{ schema = [string]$reader['SchemaName']; name = [string]$reader['ColumnName']; type = [string]$reader['TypeName'] }
    }
    @{ database = $database; columns = @($columns) } | ConvertTo-Json -Depth 5 -Compress
  } else {
    # Jedyny odczyt dokumentu. Brak dowolnego SQL, DML, DDL i procedur.
    $command.CommandText = 'SELECT Id, SchoolId, IsDel, IsCopied FROM dbo.SchoolOrder WHERE Id = @OrderId AND SchoolId = @SchoolId'
    [void]$command.Parameters.Add('@OrderId', [System.Data.SqlDbType]::Int)
    [void]$command.Parameters.Add('@SchoolId', [System.Data.SqlDbType]::Int)
    $command.Parameters['@OrderId'].Value = $OrderId
    $command.Parameters['@SchoolId'].Value = $SchoolId
    $reader = $command.ExecuteReader()
    $rows = @()
    while ($reader.Read()) {
      $rows += @{ id = [int]$reader['Id']; schoolId = [int]$reader['SchoolId']; isDel = [bool]$reader['IsDel']; isCopied = [bool]$reader['IsCopied'] }
    }
    @{ database = $database; rows = @($rows) } | ConvertTo-Json -Depth 5 -Compress
  }
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
