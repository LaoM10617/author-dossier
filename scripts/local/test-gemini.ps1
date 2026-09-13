param([switch]$SynthesisOnly, [switch]$ResearchOnly, [switch]$Supplement, [switch]$Release)
$ErrorActionPreference = 'Stop'
$secret = (Get-Content -LiteralPath (Join-Path $env:LOCALAPPDATA 'AuthorDossier/gemini-key.dpapi') -Raw).Trim() | ConvertTo-SecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:AUTHOR_DOSSIER_GEMINI_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    Push-Location (Join-Path $PSScriptRoot '../..')
    try { if ($Release) { node tests/n8n/release-check.cjs } elseif ($Supplement) { node tests/n8n/research-supplement.cjs } elseif ($ResearchOnly) { node tests/n8n/research-replay.cjs --live } elseif ($SynthesisOnly) { node tests/n8n/live-gemini.cjs --synthesis-only } else { node tests/n8n/live-gemini.cjs }; if ($LASTEXITCODE -ne 0) { throw 'Integration test failed.' } } finally { Pop-Location }
} finally {
    Remove-Item Env:AUTHOR_DOSSIER_GEMINI_KEY -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $secret.Dispose()
}
