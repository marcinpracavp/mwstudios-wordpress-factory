$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = @(
    '.factory-cache/figma/latest/manifest.json',
    '.factory-cache/figma/latest/content-map.json',
    '.factory-cache/figma/latest/sections/41-contact-heading.json',
    '.factory-cache/figma/latest/sections/42-contact-details.json',
    '.factory-cache/figma/latest/sections/43-contact-form.json',
    '.factory-cache/figma/latest/sections/44-contact-map.json'
)
foreach ($file in $files) {
    $value = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText($file, $value, $utf8NoBom)
}
