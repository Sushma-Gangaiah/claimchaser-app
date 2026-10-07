param([string]$OutputName = 'claimchaser-deploy.zip')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web.Extensions
$root = Split-Path $PSScriptRoot -Parent
$zipPath = Join-Path $root $OutputName
if (!(Test-Path -LiteralPath (Join-Path $root 'dist/index.html'))) {
    throw 'Run npm run build before packaging.'
}
$serializer = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$lock = $serializer.DeserializeObject([System.IO.File]::ReadAllText((Join-Path $root 'package-lock.json')))
$files = [ordered]@{}
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $root 'dist') -File -Recurse) {
    $files[$file.FullName.Substring($root.Length + 1).Replace('\', '/')] = $file.FullName
}
# Keep the installed production dependency layout, including nested dependencies.
foreach ($package in $lock['packages'].GetEnumerator()) {
    if (!$package.Key -or $package.Value['dev']) { continue }
    $packagePath = Join-Path $root $package.Key
    if (!(Test-Path -LiteralPath $packagePath)) {
        if ($package.Value['optional']) { continue }
        throw "Missing runtime dependency: $($package.Key)"
    }
    foreach ($file in Get-ChildItem -LiteralPath $packagePath -File -Recurse -Force) {
        $files[$file.FullName.Substring($root.Length + 1).Replace('\', '/')] = $file.FullName
    }
}
$files['startup.sh'] = Join-Path $root 'startup.sh'
$files['package.json'] = Join-Path $PSScriptRoot 'package.json'
$files['.deployment'] = Join-Path $PSScriptRoot '.deployment'

$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $directories = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($name in $files.Keys) {
        $segments = $name.Split('/')
        $directory = ''
        for ($i = 0; $i -lt $segments.Length - 1; $i++) {
            $directory += $segments[$i] + '/'
            if ($directories.Add($directory)) { $archive.CreateEntry($directory) | Out-Null }
        }
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $files[$name], $name, [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
} finally {
    $archive.Dispose()
    $stream.Dispose()
}
Get-Item -LiteralPath $zipPath | Select-Object FullName, Length
