$sourceDir = 'd:\MiniProgram\favorites-browser'
$targetDir = 'd:\MiniProgram\favorites-browser-v1.0.1'

# Create target directory
New-Item -Path $targetDir -ItemType Directory -Force | Out-Null

# Get items to exclude
$excludeItems = @('node_modules', 'dist', 'coverage', '.vscode', '.idea', 'electron.zip',
                  'Thumbs.db', '.DS_Store', '.git', '*.log', 'npm-debug.log*', 'yarn-debug.log*',
                  'yarn-error.log*', 'pnpm-debug.log*', 'lerna-debug.log*', '.pnp', '.pnp.js',
                  '.env', '.env.local', '.env.development.local', '.env.test.local', '.env.production.local',
                  '*.suo', '*.ntvs*', '*.njsproj', '*.sln', '*.sw?')

# Copy files, excluding specified items
Get-ChildItem -Path $sourceDir -Exclude $excludeItems | ForEach-Object {
    $destination = Join-Path -Path $targetDir -ChildPath $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $destination -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $destination -Force
    }
}

Write-Host "Files copied successfully! Excluded unnecessary files and directories."