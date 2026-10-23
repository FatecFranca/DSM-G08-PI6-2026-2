param(
    [string]$Database = "agendou_db",
    [string]$Username = "postgres",
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$PsqlPath
)

$ErrorActionPreference = "Stop"

function Invoke-Psql {
    param([string[]]$Arguments)

    $previousClientEncoding = $env:PGCLIENTENCODING
    try {
        $env:PGCLIENTENCODING = "UTF8"
        & $PsqlPath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "psql encerrou com código $LASTEXITCODE."
        }
    } finally {
        if ($null -eq $previousClientEncoding) {
            Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue
        } else {
            $env:PGCLIENTENCODING = $previousClientEncoding
        }
    }
}

if ($Database -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
    throw "Nome de banco inválido. Use apenas letras, números e underscore, começando por letra ou underscore."
}

if (-not $PsqlPath) {
    $psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCommand) {
        $PsqlPath = $psqlCommand.Source
    } else {
        $postgresInstallations = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending
        foreach ($installation in $postgresInstallations) {
            $candidate = Join-Path $installation.FullName "bin\psql.exe"
            if (Test-Path $candidate) {
                $PsqlPath = $candidate
                break
            }
        }
    }
}

if (-not $PsqlPath -or -not (Test-Path $PsqlPath)) {
    throw "Não encontrei o psql. Instale o componente Command Line Tools do PostgreSQL ou informe -PsqlPath com o caminho de psql.exe."
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$schemaFile = Join-Path $repositoryRoot "docs\schema.sql"
$seedFile = Join-Path $repositoryRoot "docs\seed.dev.sql"

foreach ($file in @($schemaFile, $seedFile)) {
    if (-not (Test-Path $file)) {
        throw "Arquivo necessário não encontrado: $file"
    }
}

Write-Host "Conectando ao PostgreSQL em ${HostName}:$Port como $Username."
Write-Host "O psql poderá solicitar a senha do usuário."

$databaseExists = Invoke-Psql -Arguments @(
    "-X", "-A", "-t", "-h", $HostName, "-p", "$Port", "-U", $Username, "-d", "postgres",
    "-v", "ON_ERROR_STOP=1", "-c", "SELECT 1 FROM pg_database WHERE datname = '$Database'"
)

if (-not ($databaseExists -match '1')) {
    Invoke-Psql -Arguments @(
        "-X", "-h", $HostName, "-p", "$Port", "-U", $Username, "-d", "postgres",
        "-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE `"$Database`""
    )
    Write-Host "Banco '$Database' criado."
} else {
    Write-Host "Banco '$Database' já existe; será mantido."
}

Invoke-Psql -Arguments @(
    "-X", "-h", $HostName, "-p", "$Port", "-U", $Username, "-d", $Database,
    "-v", "ON_ERROR_STOP=1", "-f", $schemaFile
)

Invoke-Psql -Arguments @(
    "-X", "-h", $HostName, "-p", "$Port", "-U", $Username, "-d", $Database,
    "-v", "ON_ERROR_STOP=1", "-c",
    "ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check; UPDATE agendamentos SET status=convert_from(decode('436f6e636c75c3ad646f','hex'),'UTF8') WHERE status=convert_from(decode('436f6e636c75c383c2ad646f','hex'),'UTF8'); ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_status_check CHECK (status IN ('Pendente','Confirmado','Cancelado',convert_from(decode('436f6e636c75c3ad646f','hex'),'UTF8')));"
)

Invoke-Psql -Arguments @(
    "-X", "-h", $HostName, "-p", "$Port", "-U", $Username, "-d", $Database,
    "-v", "ON_ERROR_STOP=1", "-f", $seedFile
)

Write-Host ""
Write-Host "Banco preparado. Contas locais de demonstração:"
Write-Host "  Cliente:      cliente@exemplo.com"
Write-Host "  Prestador:    prestador@exemplo.com"
Write-Host "  Administrador: admin@agendou.com"
Write-Host "  Senha:        Agendou2026!"
Write-Host "Configure backend\.env com a mesma conexão PostgreSQL antes de iniciar a API."
