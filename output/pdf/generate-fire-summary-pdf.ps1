$ErrorActionPreference = 'Stop'

$outputPath = Join-Path $PSScriptRoot 'fire-app-summary.pdf'

function Escape-PdfText {
    param([string]$Text)
    return $Text.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

$lines = New-Object System.Collections.Generic.List[string]

function Add-TextLine {
    param(
        [double]$X,
        [double]$Y,
        [string]$Font,
        [int]$Size,
        [string]$Color,
        [string]$Text
    )

    $escaped = Escape-PdfText $Text
    $script:lines.Add("BT")
    $script:lines.Add("$Color rg")
    $script:lines.Add("/$Font $Size Tf")
    $script:lines.Add("1 0 0 1 $([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $X)) $([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $Y)) Tm")
    $script:lines.Add("($escaped) Tj")
    $script:lines.Add("ET")
}

function Add-Rule {
    param(
        [double]$X,
        [double]$Y,
        [double]$Width,
        [double]$Height,
        [string]$Color
    )

    $script:lines.Add("$Color rg")
    $script:lines.Add("$([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $X)) $([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $Y)) $([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $Width)) $([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:0.##}', $Height)) re f")
}

Add-Rule -X 36 -Y 776 -Width 523 -Height 40 -Color '0.91 0.95 0.98'
Add-TextLine -X 46 -Y 792 -Font 'F2' -Size 22 -Color '0.17 0.34 0.49' -Text 'Fire'
Add-TextLine -X 132 -Y 794 -Font 'F1' -Size 9 -Color '0.35 0.39 0.45' -Text 'One-page repo summary based on README.md, index.html, script.js, style.css, and locales/*.json'

$y = 754
function Add-Section {
    param([string]$Title)
    Add-TextLine -X 40 -Y $script:y -Font 'F2' -Size 11 -Color '0.17 0.34 0.49' -Text $Title
    $script:y -= 15
}

function Add-Body {
    param([string]$Text)
    Add-TextLine -X 46 -Y $script:y -Font 'F1' -Size 9 -Color '0.13 0.16 0.20' -Text $Text
    $script:y -= 11
}

function Add-Bullet {
    param([string]$Text)
    Add-TextLine -X 46 -Y $script:y -Font 'F1' -Size 9 -Color '0.13 0.16 0.20' -Text "- $Text"
    $script:y -= 10.5
}

Add-Section 'What It Is'
Add-Body 'Fire is a FIRE calculator for couples from Europe.'
Add-Body 'It is a static browser app that models portfolio growth and drawdown using ages, contributions, expenses, pensions, inflation, and returns.'
$y -= 5

Add-Section 'Who It Is For'
Add-Body 'Primary user/persona: couples in Europe comparing shared retirement scenarios and long-term financial independence tradeoffs.'
$y -= 5

Add-Section 'What It Does'
Add-Bullet 'Models two people with separate current, retirement, pension, and end ages.'
Add-Bullet 'Charts portfolio value across three phases: 2 work, 1 work, and 0 work.'
Add-Bullet 'Adjusts for current assets, annual return, annual contributions, annual spending, and inflation.'
Add-Bullet 'Adds pension income for both people during retirement years.'
Add-Bullet 'Supports three extra-cost entries with configurable start and end years.'
Add-Bullet 'Can show projections in nominal values or today''s purchasing power.'
Add-Bullet 'Loads English, Dutch, French, and German labels and saves slider inputs in localStorage.'
$y -= 5

Add-Section 'How It Works'
Add-Bullet 'UI shell: index.html defines a three-panel slider interface plus a central canvas for the chart.'
Add-Bullet 'Presentation: style.css controls desktop/mobile layout, panel styling, and slider appearance.'
Add-Bullet 'Logic: script.js initializes i18next, restores localStorage values, recalculates yearly data, and redraws Chart.js on input changes.'
Add-Bullet 'Data flow: user input -> DOM event listeners -> calculatePortfolioGrowth(...) -> datasets by work phase -> chart and tooltips.'
Add-Bullet 'Services/data: locale JSON files in locales/ are fetched by i18next; no repo-hosted backend, database, or auth flow found in repo.'
$y -= 5

Add-Section 'How To Run'
Add-Bullet 'Open the repo root containing index.html, script.js, style.css, and locales/.'
Add-Bullet 'Serve the folder over HTTP, because script.js loads /locales/{{lng}}.json and index.html references CDN-hosted Chart.js and i18next scripts.'
Add-Bullet 'Open the served index.html page in a browser and adjust the sliders.'
Add-Bullet 'Exact start command, package manifest, deployment setup, and test instructions: Not found in repo.'

Add-Rule -X 36 -Y 34 -Width 523 -Height 0.8 -Color '0.84 0.88 0.92'
Add-TextLine -X 40 -Y 20 -Font 'F1' -Size 8 -Color '0.35 0.39 0.45' -Text 'Evidence basis: README names the app; HTML/CSS/JS show a static slider-driven UI with Chart.js and i18next; locales/ confirms four languages.'

$stream = ($lines -join "`n") + "`n"
$streamBytes = [System.Text.Encoding]::ASCII.GetBytes($stream)
$streamLength = $streamBytes.Length

$objects = @(
    "1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n",
    "2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n",
    "3 0 obj`n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`nendobj`n",
    "4 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n",
    "5 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`nendobj`n",
    "6 0 obj`n<< /Length $streamLength >>`nstream`n$stream" + "endstream`nendobj`n"
)

$builder = New-Object System.Text.StringBuilder
[void]$builder.Append("%PDF-1.4`n")
$offsets = New-Object System.Collections.Generic.List[int]

foreach ($obj in $objects) {
    $offsets.Add([System.Text.Encoding]::ASCII.GetByteCount($builder.ToString()))
    [void]$builder.Append($obj)
}

$xrefOffset = [System.Text.Encoding]::ASCII.GetByteCount($builder.ToString())
[void]$builder.Append("xref`n")
[void]$builder.Append("0 7`n")
[void]$builder.Append("0000000000 65535 f `n")

foreach ($offset in $offsets) {
    [void]$builder.Append(($offset.ToString('D10') + " 00000 n `n"))
}

[void]$builder.Append("trailer`n")
[void]$builder.Append("<< /Size 7 /Root 1 0 R >>`n")
[void]$builder.Append("startxref`n")
[void]$builder.Append("$xrefOffset`n")
[void]$builder.Append("%%EOF")

[System.IO.File]::WriteAllBytes($outputPath, [System.Text.Encoding]::ASCII.GetBytes($builder.ToString()))
Write-Output $outputPath
