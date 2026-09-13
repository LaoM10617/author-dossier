$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskCli = Join-Path $taskRoot '.runtime/node_modules/n8n/bin/n8n'
if (!(Test-Path -LiteralPath $taskCli)) { throw 'Run npm run setup:n8n in the repository first.' }
$taskVars = @{
    N8N_USER_FOLDER = (Join-Path $taskRoot '.runtime/ui-data')
    N8N_LISTEN_ADDRESS = '127.0.0.1'
    N8N_HOST = 'localhost'
    N8N_PORT = '5678'
    N8N_PROTOCOL = 'http'
    N8N_DIAGNOSTICS_ENABLED = 'false'
    N8N_VERSION_NOTIFICATIONS_ENABLED = 'false'
}
$taskPrevious = @{}
foreach ($taskName in $taskVars.Keys) {
    $taskPrevious[$taskName] = [Environment]::GetEnvironmentVariable($taskName, 'Process')
    [Environment]::SetEnvironmentVariable($taskName, $taskVars[$taskName], 'Process')
}
try {
    Write-Host 'Open http://localhost:5678 after n8n starts. Press Ctrl+C here to stop.'
    Write-Host 'This editor uses a separate local database in .runtime/ui-data.'
    & node $taskCli start
} finally {
    foreach ($taskName in $taskVars.Keys) {
        [Environment]::SetEnvironmentVariable($taskName, $taskPrevious[$taskName], 'Process')
    }
}
