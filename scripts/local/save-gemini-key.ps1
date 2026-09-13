# Stores the API key encrypted for the current Windows user, outside the repository.
$ErrorActionPreference = 'Stop'
$credentialDir = Join-Path $env:LOCALAPPDATA 'AuthorDossier'
New-Item -ItemType Directory -Path $credentialDir -Force | Out-Null
$apiSecret = Read-Host 'Paste your Gemini API key (input hidden)' -AsSecureString
if ($apiSecret.Length -eq 0) { throw 'Empty key; nothing saved.' }
$encryptedSecret = ConvertFrom-SecureString -SecureString $apiSecret
Set-Content -LiteralPath (Join-Path $credentialDir 'gemini-key.dpapi') -Value $encryptedSecret -Encoding utf8
$apiSecret.Dispose()
Write-Host 'Saved encrypted for this Windows user, outside the repository. Key was not printed.'
