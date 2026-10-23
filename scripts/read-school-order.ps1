param(
  [ValidateSet('Probe', 'ReadOrder', 'FindHistorical', 'FindHistoricalWithHistory', 'FindStatusAudit', 'ReadHistorical', 'DocumentTypes', 'FindCopyHistory', 'FindCopyStates', 'ReadCopyPair')][string]$Action = 'Probe',
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
  if ($Action -in @('ReadOrder', 'ReadHistorical', 'ReadCopyPair') -and ($OrderId -le 0 -or $SchoolId -le 0)) { throw 'INVALID_ID' }

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
    $reader.Dispose(); $reader = $null
    $command.CommandText = @'
SELECT t.name AS TableName, c.name AS ColumnName
FROM sys.tables t JOIN sys.columns c ON c.object_id = t.object_id
WHERE t.name LIKE N'%Order%' OR t.name LIKE N'%History%' OR t.name LIKE N'%Relation%' OR t.name LIKE N'%Access%' OR t.name IN (N'User', N'Users', N'School', N'TeacherFormClub')
ORDER BY t.name, c.column_id
'@
    $reader = $command.ExecuteReader()
    $relatedColumns = @()
    while ($reader.Read()) { $relatedColumns += @{ table = [string]$reader['TableName']; column = [string]$reader['ColumnName'] } }
    @{ database = $database; columns = @($columns); relatedColumns = @($relatedColumns) } | ConvertTo-Json -Depth 5 -Compress
  } elseif ($Action -in @('DocumentTypes', 'FindCopyHistory', 'FindCopyStates', 'ReadCopyPair')) {
    if ($Action -eq 'DocumentTypes') {
      $command.CommandText = @'
SELECT TOP (100) Id AS id, Symbol AS symbol, Description AS description FROM dbo.DictSchoolOrderType ORDER BY Id
'@
    } elseif ($Action -eq 'FindCopyHistory') {
      $command.CommandText = @'
WITH pairs AS (
SELECT TOP (500) s.Id AS sourceId,s.SchoolId AS sourceSchoolId,c.Id AS copyId,c.SchoolId AS copySchoolId
FROM dbo.RelationsCopiedInstitutionsOrders r
JOIN dbo.SchoolOrder s ON s.Id=r.InstitutionOrderIdCopiedFrom
JOIN dbo.SchoolOrder c ON c.Id=r.InstitutionOrderIdCopiedTo
JOIN dbo.[User] u ON u.Id=s.CreatedBy
WHERE r.InstitutionTypeIdCopiedFrom=1 AND r.InstitutionTypeIdCopiedTo=1
 AND s.IsCopied=0 AND c.IsCopied=1 AND s.IsDel=0 AND c.IsDel=0 AND u.Login=N'automat'
ORDER BY s.Id DESC,c.Id DESC
)
SELECT TOP (10) pairs.sourceId,pairs.sourceSchoolId,pairs.copyId,pairs.copySchoolId,p.DictOrderItemId AS productId
FROM pairs
CROSS APPLY (SELECT TOP (1) i.DictOrderItemId FROM dbo.SchoolOrderItem i
 WHERE i.SchoolOrderId=pairs.sourceId AND EXISTS (SELECT 1 FROM dbo.InstitutionOrderItemHistory h WHERE h.InstitutionOrderItemId=i.Id AND h.InstitutionTypeId=1)
 AND EXISTS (SELECT 1 FROM dbo.SchoolOrderItem ci WHERE ci.SchoolOrderId=pairs.copyId AND ci.DictOrderItemId=i.DictOrderItemId)
 ORDER BY i.Id) p
ORDER BY pairs.sourceId DESC,pairs.copyId DESC
'@
    } elseif ($Action -eq 'FindCopyStates') {
      $command.CommandText = @'
WITH candidates AS (
 SELECT s.Id AS sourceId, s.SchoolId AS sourceSchoolId, c.Id AS copyId, c.SchoolId AS copySchoolId,
 s.IsDel AS sourceDeleted, s.IsCanceled AS sourceCanceled, c.IsDel AS copyDeleted,
 t.Symbol AS typeSymbol, t.Description AS typeDescription,
 ROW_NUMBER() OVER(PARTITION BY s.IsDel,s.IsCanceled,s.InstitutionOrderTypeId ORDER BY s.Id DESC,c.Id DESC) AS rn
 FROM dbo.RelationsCopiedInstitutionsOrders r
 JOIN dbo.SchoolOrder s ON s.Id=r.InstitutionOrderIdCopiedFrom
 JOIN dbo.SchoolOrder c ON c.Id=r.InstitutionOrderIdCopiedTo
 JOIN dbo.[User] u ON u.Id=s.CreatedBy
 LEFT JOIN dbo.DictSchoolOrderType t ON t.Id=s.InstitutionOrderTypeId
 WHERE r.InstitutionTypeIdCopiedFrom=1 AND r.InstitutionTypeIdCopiedTo=1
 AND s.IsCopied=0 AND c.IsCopied=1 AND u.Login=N'automat'
)
SELECT TOP (40) * FROM candidates WHERE rn<=3 ORDER BY sourceId DESC,copyId DESC
'@
    } else {
      $command.CommandText = @'
SELECT s.Id AS sourceId,s.SchoolId AS sourceSchoolId,s.IsDel AS sourceDeleted,s.IsCanceled AS sourceCanceled,
 s.CmsOrderSymbol AS sourceCmsSymbol,s.SalesOrderSymbol AS sourceSalesSymbol,s.CreatedAt AS sourceCreatedAt,
 c.Id AS copyId,c.SchoolId AS copySchoolId,c.IsDel AS copyDeleted,c.IsCopied AS copyMarked,c.IsCanceled AS copyCanceled,
 c.CmsOrderSymbol AS copyCmsSymbol,c.SalesOrderSymbol AS copySalesSymbol,c.CreatedAt AS copyCreatedAt,
 t.Symbol AS typeSymbol,t.Description AS typeDescription,
 (SELECT COUNT(*) FROM dbo.SchoolDataChangeHistory h JOIN dbo.[User] hu ON hu.Id=h.CreatedBy
  WHERE h.SchoolId=s.SchoolId AND hu.Login=N'automat'
  AND (h.Field LIKE N'%usuni%' OR h.Field LIKE N'%anul%' OR h.Value LIKE N'%usuni%' OR h.Value LIKE N'%anul%')
  AND PATINDEX(N'%[^0-9]'+CONVERT(nvarchar(20),s.Id)+N'[^0-9]%',N' '+h.Value+N' ')>0) AS sourceStatusAuditCount
FROM dbo.SchoolOrder s JOIN dbo.RelationsCopiedInstitutionsOrders r ON r.InstitutionOrderIdCopiedFrom=s.Id
JOIN dbo.SchoolOrder c ON c.Id=r.InstitutionOrderIdCopiedTo
LEFT JOIN dbo.DictSchoolOrderType t ON t.Id=s.InstitutionOrderTypeId
WHERE s.Id=@OrderId AND s.SchoolId=@SchoolId AND r.InstitutionTypeIdCopiedFrom=1 AND r.InstitutionTypeIdCopiedTo=1
ORDER BY c.Id
'@
      [void]$command.Parameters.Add('@OrderId', [System.Data.SqlDbType]::Int)
      [void]$command.Parameters.Add('@SchoolId', [System.Data.SqlDbType]::Int)
      $command.Parameters['@OrderId'].Value = $OrderId; $command.Parameters['@SchoolId'].Value = $SchoolId
    }
    $reader = $command.ExecuteReader(); $rows = @()
    while ($reader.Read()) {
      $row = @{}
      for ($i=0; $i -lt $reader.FieldCount; $i++) {
        $value=$reader.GetValue($i)
        if ($value -is [DBNull]) { $value=$null }
        elseif ($value -is [datetime]) { $value=$value.ToString('o') }
        $row[$reader.GetName($i)]=$value
      }
      $rows += $row
    }
    @{ database=$database; rows=@($rows) } | ConvertTo-Json -Depth 6 -Compress
  } elseif ($Action -in @('FindHistorical', 'FindHistoricalWithHistory')) {
    # Kandydaci, nie dowód pochodzenia zmiany. Żaden rekord nie jest modyfikowany.
    $command.CommandText = @'
WITH candidates AS (
 SELECT Id, SchoolId, IsDel, IsCanceled, IsCopied, CreatedBy, CreatedAt, CmsOrderSymbol, SalesOrderSymbol,
 ROW_NUMBER() OVER (PARTITION BY IsCanceled ORDER BY Id DESC) AS CandidateRank
 FROM dbo.SchoolOrder o
 WHERE (IsCanceled = 1 OR IsDel = 1) AND IsCopied = 0
 AND (NULLIF(CmsOrderSymbol, N'') IS NOT NULL OR NULLIF(SalesOrderSymbol, N'') IS NOT NULL)
 AND COALESCE(SalesOrderSymbol, N'') NOT LIKE N'%/BOK/%'
 AND CreatedBy IN (SELECT Id FROM dbo.[User] WHERE Login = N'automat')
 AND (@RequireHistory = 0 OR EXISTS (
   SELECT 1 FROM dbo.SchoolOrderItem i JOIN dbo.InstitutionOrderItemHistory h ON h.InstitutionOrderItemId = i.Id
   WHERE i.SchoolOrderId = o.Id AND h.InstitutionTypeId = 1
 ))
)
SELECT Id, SchoolId, IsDel, IsCanceled, IsCopied, CreatedBy, CreatedAt, CmsOrderSymbol, SalesOrderSymbol,
 (SELECT TOP (1) i.DictOrderItemId FROM dbo.SchoolOrderItem i
 JOIN dbo.InstitutionOrderItemHistory h ON h.InstitutionOrderItemId = i.Id
 WHERE i.SchoolOrderId = candidates.Id AND h.InstitutionTypeId = 1 ORDER BY h.CreatedAt DESC, h.Id DESC) AS HistoryProductId
FROM candidates WHERE CandidateRank <= 5 ORDER BY IsCanceled DESC, Id DESC
'@
    [void]$command.Parameters.Add('@RequireHistory', [System.Data.SqlDbType]::Bit)
    $command.Parameters['@RequireHistory'].Value = $Action -eq 'FindHistoricalWithHistory'
    $reader = $command.ExecuteReader()
    $rows = @()
    while ($reader.Read()) {
      $historyProductId = $null
      if (-not $reader.IsDBNull($reader.GetOrdinal('HistoryProductId'))) { $historyProductId = [int]$reader['HistoryProductId'] }
      $rows += @{ id = [int]$reader['Id']; schoolId = [int]$reader['SchoolId']; isDel = [bool]$reader['IsDel']; isCanceled = [bool]$reader['IsCanceled']; isCopied = [bool]$reader['IsCopied']; createdBy = [int]$reader['CreatedBy']; createdAt = ([datetime]$reader['CreatedAt']).ToString('o'); cmsOrderSymbol = [string]$reader['CmsOrderSymbol']; salesOrderSymbol = [string]$reader['SalesOrderSymbol']; historyProductId = $historyProductId }
    }
    @{ database = $database; rows = @($rows) } | ConvertTo-Json -Depth 5 -Compress
  } elseif ($Action -eq 'FindStatusAudit') {
    $command.CommandText = @'
SELECT TOP (10) h.Id, h.SchoolId, h.Field, h.Value, h.ChangedAt, u.Login
FROM dbo.SchoolDataChangeHistory h JOIN dbo.[User] u ON u.Id = h.CreatedBy
WHERE h.Field LIKE N'%Zam%' AND (h.Field LIKE N'%usuni%' OR h.Field LIKE N'%anul%' OR h.Value LIKE N'%usuni%' OR h.Value LIKE N'%anul%')
AND u.Login = N'automat'
ORDER BY h.ChangedAt DESC, h.Id DESC
'@
    $reader = $command.ExecuteReader(); $rows = @()
    while ($reader.Read()) { $rows += @{ id = [int]$reader['Id']; schoolId = [int]$reader['SchoolId']; field = [string]$reader['Field']; value = [string]$reader['Value']; changedAt = ([datetime]$reader['ChangedAt']).ToString('o'); actor = [string]$reader['Login'] } }
    @{ database = $database; rows = @($rows) } | ConvertTo-Json -Depth 5 -Compress
  } elseif ($Action -eq 'ReadHistorical') {
    $command.CommandText = @'
SELECT o.Id, o.SchoolId, o.IsDel, o.IsCopied, o.IsCanceled, o.CreatedBy, o.CreatedAt,
o.CmsOrderSymbol, o.SalesOrderSymbol, u.Login
FROM dbo.SchoolOrder o JOIN dbo.[User] u ON u.Id = o.CreatedBy
WHERE o.Id = @OrderId AND o.SchoolId = @SchoolId
'@
    [void]$command.Parameters.Add('@OrderId', [System.Data.SqlDbType]::Int)
    [void]$command.Parameters.Add('@SchoolId', [System.Data.SqlDbType]::Int)
    $command.Parameters['@OrderId'].Value = $OrderId; $command.Parameters['@SchoolId'].Value = $SchoolId
    $reader = $command.ExecuteReader(); $rows = @()
    while ($reader.Read()) { $rows += @{ id = [int]$reader['Id']; schoolId = [int]$reader['SchoolId']; isDel = [bool]$reader['IsDel']; isCopied = [bool]$reader['IsCopied']; isCanceled = [bool]$reader['IsCanceled']; createdBy = [int]$reader['CreatedBy']; createdAt = ([datetime]$reader['CreatedAt']).ToString('o'); cmsOrderSymbol = [string]$reader['CmsOrderSymbol']; salesOrderSymbol = [string]$reader['SalesOrderSymbol']; actor = [string]$reader['Login'] } }
    @{ database = $database; rows = @($rows) } | ConvertTo-Json -Depth 5 -Compress
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
