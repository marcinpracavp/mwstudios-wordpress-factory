$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$snapshot = Join-Path $root '.factory-cache/figma/latest'

function Save-Crop([string]$output, [int]$x, [int]$y, [int]$width, [int]$height) {
    Add-Type -AssemblyName System.Drawing
    $source = [System.Drawing.Bitmap]::FromFile((Join-Path $snapshot 'references/full/frame-335-591.png'))
    try {
        $crop = New-Object System.Drawing.Bitmap $width, $height
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($crop)
            try {
                $graphics.DrawImage($source, (New-Object System.Drawing.Rectangle 0, 0, $width, $height), (New-Object System.Drawing.Rectangle $x, $y, $width, $height), [System.Drawing.GraphicsUnit]::Pixel)
                $crop.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
            } finally { $graphics.Dispose() }
        } finally { $crop.Dispose() }
    } finally { $source.Dispose() }
}

$assetDir = Join-Path $snapshot 'assets/contact'
$referenceDir = Join-Path $snapshot 'references/sections'
New-Item -ItemType Directory -Force -Path $assetDir, $referenceDir | Out-Null
Invoke-WebRequest -UseBasicParsing -Uri 'https://www.figma.com/api/mcp/asset/13858fc2-ce3b-40e6-b9fc-2084a0c6980a.png' -OutFile (Join-Path $assetDir 'contact-heading-335-702.png')
Invoke-WebRequest -UseBasicParsing -Uri 'https://www.figma.com/api/mcp/asset/4456ad80-9ce4-4e0b-a59c-1b0de9c66451.png' -OutFile (Join-Path $assetDir 'contact-map-431-924.png')
Invoke-WebRequest -UseBasicParsing -Uri 'https://www.figma.com/api/mcp/asset/f1c51a55-1db1-43be-92f6-fcd879f497c9.svg' -OutFile (Join-Path $assetDir 'contact-icon-address-335-771.svg')
Invoke-WebRequest -UseBasicParsing -Uri 'https://www.figma.com/api/mcp/asset/8136ba2a-db43-470b-b2a4-4e63dc283de9.svg' -OutFile (Join-Path $assetDir 'contact-icon-phone-335-764.svg')
Invoke-WebRequest -UseBasicParsing -Uri 'https://www.figma.com/api/mcp/asset/a744ffb0-7e8d-478f-9d45-ef27b076d9a7.svg' -OutFile (Join-Path $assetDir 'contact-icon-email-335-769.svg')

Save-Crop (Join-Path $referenceDir 'contact-heading.png') 240 218 1440 220
Save-Crop (Join-Path $referenceDir 'contact-details.png') 240 485 467 1341
Save-Crop (Join-Path $referenceDir 'contact-form.png') 728 519 953 376
Save-Crop (Join-Path $referenceDir 'contact-map.png') 728 983 953 568

$jsonOptions = @{ Depth = 100 }
$manifestPath = Join-Path $snapshot 'manifest.json'
$contentMapPath = Join-Path $snapshot 'content-map.json'
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$contentMap = Get-Content -Raw -LiteralPath $contentMapPath | ConvertFrom-Json

$sections = @(
    [ordered]@{
        id = 'contact-heading'; name = 'Kontakt heading and breadcrumb'; order = 41
        source = [ordered]@{ pageId = '0:1'; desktopNodeId = '335:702' }
        desktop = [ordered]@{ frameWidth = 1920; x = 240; y = 218; width = 1440; height = 220; containerWidth = 1440; padding = [ordered]@{ left = 0; right = 0 }; gap = 0 }
        layout = [ordered]@{ type = 'banner-and-breadcrumb'; productionFrame = '335:591'; designContextRead = $true; nodes = @('335:702','335:703','335:592'); banner = [ordered]@{ height = 150; radius = 30 }; breadcrumb = [ordered]@{ y = 368; height = 70 } }
        typography = @([ordered]@{ nodeId = '335:703'; family = 'DM Sans'; weight = 700; size = 48; lineHeight = 24; align = 'center'; color = '#ffffff' }, [ordered]@{ nodeId = '335:592'; family = 'DM Sans'; weight = 400; size = 14; lineHeight = 34; align = 'left' })
        assets = @([ordered]@{ sourceNodeId = '335:702'; path = 'assets/contact/contact-heading-335-702.png'; kind = 'image'; fillHash = 'f370ec4cc703e9a97bca17d78a8445bf3e6c2926'; role = 'banner background' })
        contentFields = @('335:703','335:592')
        notes = @('Lossless 1x crop from references/full/frame-335-591.png: x=240,y=218,width=1440,height=220. No mobile source exists; responsive behavior is derived.')
        liveFigmaRequired = $false
    },
    [ordered]@{
        id = 'contact-details'; name = 'Contact offices and department details'; order = 42
        source = [ordered]@{ pageId = '0:1'; desktopNodeId = '335:710' }
        desktop = [ordered]@{ frameWidth = 1920; x = 240; y = 485; width = 467; height = 1341; containerWidth = 467; padding = [ordered]@{ left = 51; right = 46 }; gap = 31 }
        layout = [ordered]@{ type = 'stacked-contact-cards'; productionFrame = '335:591'; designContextRead = $true; nodes = @('335:710','431:897','431:908'); cardWidths = @(467,467,467); cardHeights = @(467,334,478); verticalGaps = @(31,31); fill = '#f6f6f6'; radius = 31 }
        typography = @([ordered]@{ family = 'DM Sans'; weights = @(400,700); textSize = 18; lineHeight = 24 }, [ordered]@{ nodeId = '335:714'; family = 'DM Sans'; weight = 700; size = 36; lineHeight = 24 })
        assets = @([ordered]@{ sourceNodeId = '335:771'; path = 'assets/contact/contact-icon-address-335-771.svg'; kind = 'svg'; role = 'address icon' }, [ordered]@{ sourceNodeId = '335:764'; path = 'assets/contact/contact-icon-phone-335-764.svg'; kind = 'svg'; role = 'phone icon' }, [ordered]@{ sourceNodeId = '335:769'; path = 'assets/contact/contact-icon-email-335-769.svg'; kind = 'svg'; role = 'email icon' })
        contentFields = @('335:714','335:719','335:716','431:898','431:899','431:911','431:910','431:919','431:918','431:922','431:921')
        notes = @('Lossless 1x crop from references/full/frame-335-591.png: x=240,y=485,width=467,height=1341. Green address/phone/email icons are source vectors; their presentation is retained in the reference crop and requires exact export when implementing the icon component. No mobile source exists; responsive behavior is derived.')
        liveFigmaRequired = $false
    },
    [ordered]@{
        id = 'contact-form'; name = 'Contact form'; order = 43
        source = [ordered]@{ pageId = '0:1'; desktopNodeId = '339:795' }
        desktop = [ordered]@{ frameWidth = 1920; x = 728; y = 519; width = 953; height = 376; containerWidth = 953; padding = [ordered]@{ top = 0; right = 0; bottom = 0; left = 0 }; gap = 15 }
        layout = [ordered]@{ type = 'two-column-contact-form'; productionFrame = '335:591'; designContextRead = $true; nodes = @('339:795','339:788','339:790','339:792','339:786','339:797','431:907'); columns = @([ordered]@{ width = 345; fieldHeight = 62; gap = 15 }, [ordered]@{ width = 588; textareaHeight = 215 }); rowGap = 15; fieldRadius = 15; textareaRadius = 31; button = [ordered]@{ width = 224; height = 44; radius = 30; color = '#056838' } }
        typography = @([ordered]@{ nodeId = '339:795'; family = 'DM Sans'; weight = 700; size = 36; lineHeight = 24; align = 'right' }, [ordered]@{ nodeId = '339:813'; family = 'DM Sans'; weight = 400; size = 12 }, [ordered]@{ nodeId = '339:803'; family = 'DM Sans'; weight = 700; size = 16 })
        contentFields = @('339:795','339:813','339:807','339:809','339:805','339:803','431:907')
        notes = @('Lossless 1x crop from references/full/frame-335-591.png: x=728,y=519,width=953,height=376. A visible form layout and labels are sourced; no native CF7 identity, recipient mailbox, privacy-policy destination or submission behavior is in Figma. No mobile source exists; responsive behavior is derived.')
        liveFigmaRequired = $false
    },
    [ordered]@{
        id = 'contact-map'; name = 'Contact location map'; order = 44
        source = [ordered]@{ pageId = '0:1'; desktopNodeId = '431:924' }
        desktop = [ordered]@{ frameWidth = 1920; x = 728; y = 983; width = 953; height = 568; containerWidth = 953; padding = [ordered]@{ left = 0; right = 0 }; gap = 0 }
        layout = [ordered]@{ type = 'map-image'; productionFrame = '335:591'; designContextRead = $true; nodes = @('431:924'); radius = 30; objectFit = 'cover'; reactions = @() }
        assets = @([ordered]@{ sourceNodeId = '431:924'; path = 'assets/contact/contact-map-431-924.png'; kind = 'image'; fillHash = 'aac892a6737d5096d39ca89bfe1e8d60e5ae17ce'; role = 'location map' })
        notes = @('Lossless 1x crop from references/full/frame-335-591.png: x=728,y=983,width=953,height=568. Node 431:924 has no Figma reactions or hyperlink, so no map destination is inferred. No mobile source exists; responsive behavior is derived.')
        liveFigmaRequired = $false
    }
)

foreach ($section in $sections) {
    $file = "sections/{0:D2}-{1}.json" -f $section.order, $section.id
    if (-not @($manifest.sections | Where-Object { $_.id -eq $section.id }).Count) {
        $reference = "references/sections/{0}.png" -f $section.id
        $entry = [pscustomobject][ordered]@{ id = $section.id; name = $section.name; order = $section.order; pageId = '0:1'; snapshot = $file; desktopNodeId = $section.source.desktopNodeId; desktopReference = $reference }
        $manifest.sections += $entry
    }
    $section | ConvertTo-Json @jsonOptions | Set-Content -LiteralPath (Join-Path $snapshot $file) -Encoding utf8
}
$route = @($manifest.routes | Where-Object { $_.id -eq 'contact' })[0]
if (-not $route) { throw 'Contact route was not found in manifest.' }
Add-Member -InputObject $route.sectionGeometry -NotePropertyName 'contact-heading' -NotePropertyValue ([pscustomobject]@{ x = 240; y = 218; width = 1440; height = 220 }) -Force
Add-Member -InputObject $route.sectionGeometry -NotePropertyName 'contact-details' -NotePropertyValue ([pscustomobject]@{ x = 240; y = 485; width = 467; height = 1341 }) -Force
Add-Member -InputObject $route.sectionGeometry -NotePropertyName 'contact-form' -NotePropertyValue ([pscustomobject]@{ x = 728; y = 519; width = 953; height = 376 }) -Force
Add-Member -InputObject $route.sectionGeometry -NotePropertyName 'contact-map' -NotePropertyValue ([pscustomobject]@{ x = 728; y = 983; width = 953; height = 568 }) -Force

$newFields = @(
    @('contact-heading','335:703','rudnikagro_contact_heading_title','text','Kontakt','ACF contact page / heading tab / title'),
    @('contact-heading','335:592','rudnikagro_contact_heading_breadcrumb','text','Strona główna  /  Kontakt','ACF contact page / heading tab / breadcrumb'),
    @('contact-heading','335:702','rudnikagro_contact_heading_image','image','assets/contact/contact-heading-335-702.png','ACF contact page / heading tab / banner image attachment ID'),
    @('contact-details','335:714','rudnikagro_contact_office_heading','text','Siedziba firmy','ACF contact page / contact details tab / office card heading'),
    @('contact-details','335:719','rudnikagro_contact_office_company','text','Rudnikagro Sp. z o.o.','ACF contact page / contact details tab / office card company'),
    @('contact-details','335:716','rudnikagro_contact_office_details','textarea',"ul. Stargardzka 8,`n74-200 Pyrzyce`n`nNIP: 499 03 49 671`n`n+48 535 500 612`nod poniedziałku do piątku, w godzinach 8:00-16:00`n`nsklep@rudnikagro.pl",'ACF contact page / contact details tab / office card details'),
    @('contact-details','431:898','rudnikagro_contact_branch_heading','textarea',"Oddział Lipiany`nsklep i magazyn",'ACF contact page / contact details tab / branch card heading'),
    @('contact-details','431:899','rudnikagro_contact_branch_details','textarea',"ul. Myśliborska 5a,`n74-240 Lipiany`n`ntel. (+48) 91 579 31 63`nfax. (+48) 91 564 53 06",'ACF contact page / contact details tab / branch card details'),
    @('contact-details','431:911','rudnikagro_contact_sales_heading','text','Przedstawiciele handlowi: ','ACF contact page / contact details tab / department card'),
    @('contact-details','431:910','rudnikagro_contact_sales_contact','textarea',"Mateusz Świątek,`ntel. +48 781 600 023`nm.swiatek@rudnikagro.pl",'ACF contact page / contact details tab / department card'),
    @('contact-details','431:919','rudnikagro_contact_insurance_heading','text','Dział ubezpieczeń: ','ACF contact page / contact details tab / department card'),
    @('contact-details','431:918','rudnikagro_contact_insurance_contact','textarea',"Monika Zielińska,`ntel. +48 532 402 999`nm.zielinska@rudnikagro.pl",'ACF contact page / contact details tab / department card'),
    @('contact-details','431:922','rudnikagro_contact_protection_heading','text','Dział środków ochrony roślin: ','ACF contact page / contact details tab / department card'),
    @('contact-details','431:921','rudnikagro_contact_protection_contact','textarea',"Mariusz Rudnicki,`ntel. +48 91 461 25 64`nm.rudnicki@rudnikagro.pl",'ACF contact page / contact details tab / department card'),
    @('contact-form','339:795','rudnikagro_contact_form_heading','text','Formularz kontaktowy','ACF contact page / form tab / heading'),
    @('contact-form','339:813','rudnikagro_contact_form_name_label','text','Imię','ACF contact page / form tab / name label'),
    @('contact-form','339:807','rudnikagro_contact_form_email_label','text','Adres e-mail','ACF contact page / form tab / email label'),
    @('contact-form','339:809','rudnikagro_contact_form_phone_label','text','Numer telefonu','ACF contact page / form tab / phone label'),
    @('contact-form','339:805','rudnikagro_contact_form_message_label','text','Treść wiadomości','ACF contact page / form tab / message label'),
    @('contact-form','339:803','rudnikagro_contact_form_submit_label','text','Wyślij','ACF contact page / form tab / submit label'),
    @('contact-form','431:907','rudnikagro_contact_form_privacy_notice','textarea','Podanie danych zawartych w formularzu jest dobrowolne, ale niezbędne do przetworzenia zapytania. Szczegóły związane z przetwarzaniem danych przez administratorów zawarte są w Polityce Prywatności.','ACF contact page / form tab / privacy notice'),
    @('contact-map','431:924','rudnikagro_contact_map_image','image','assets/contact/contact-map-431-924.png','ACF contact page / map tab / image attachment ID')
)
foreach ($item in $newFields) {
    $section, $nodeId, $fieldName, $type, $value, $destination = $item
    if (-not @($contentMap.fields | Where-Object { $_.fieldName -eq $fieldName }).Count) {
        $contentMap.fields += [pscustomobject][ordered]@{ section = $section; nodeId = $nodeId; fieldName = $fieldName; type = $type; language = 'pl'; value = $value; destination = $destination; ownership = [ordered]@{ project = 'rudnikagro'; sourceNodeId = $nodeId } }
    }
}
$manifest | ConvertTo-Json @jsonOptions | Set-Content -LiteralPath $manifestPath -Encoding utf8
$contentMap | ConvertTo-Json @jsonOptions | Set-Content -LiteralPath $contentMapPath -Encoding utf8

$planPath = Join-Path $root 'docs/factory/project/PLAN.md'
$planAddition = @'

<!-- factory-contact-discovery -->
## Contact — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Contact heading | rudnikagro_contact_heading_title, rudnikagro_contact_heading_breadcrumb, rudnikagro_contact_heading_image | Text, Text, Image | strings, attachment ID | Page: Kontakt / Heading tab |
| Contact details | rudnikagro_contact_blocks | Repeater: card heading, company, detail textarea | source strings | Page: Kontakt / Contact details tab |
| Contact form presentation | rudnikagro_contact_form_heading, rudnikagro_contact_form_labels, rudnikagro_contact_form_privacy_notice | Text, Group of Text, Textarea | strings | Page: Kontakt / Form tab |
| Contact form binding | rudnikagro_contact_form | Post Object limited to wpcf7_contact_form | post ID | Page: Kontakt / Form tab |
| Contact map | rudnikagro_contact_map_image | Image | attachment ID | Page: Kontakt / Map tab |

The Figma form supplies presentation labels only. The real CF7 form identity, recipient and privacy-policy reference remain unconfigured source gaps; no synthetic form behavior is authorized. The map is a sourced image and has no Figma hyperlink or reaction, so it is not assigned an invented external destination. All four contact section references are unscaled 1x crops from `references/full/frame-335-591.png`; mobile remains derived.
'@
if (-not (Select-String -LiteralPath $planPath -SimpleMatch '<!-- factory-contact-discovery -->' -Quiet)) { Add-Content -LiteralPath $planPath -Value $planAddition -Encoding utf8 }

$clarificationsPath = Join-Path $root 'docs/factory/project/SOURCE_CLARIFICATIONS.md'
$clarification = @'

<!-- factory-contact-source-clarifications -->
15. Contact frame `335:591` supplies the visual layout, labels and privacy notice, but no Contact Form 7 form identity, recipient mailbox or submission configuration. Do not simulate a submission or send email until these native settings are supplied.
16. Contact map node `431:924` has no Figma reaction or hyperlink. Preserve its sourced map image and request an approved destination only if an interactive map link is required.
17. Contact privacy-notice node `431:907` has no Figma reaction, hyperlink or styled text link. Preserve the visible text exactly; do not invent a Privacy Policy URL.
'@
if (-not (Select-String -LiteralPath $clarificationsPath -SimpleMatch '<!-- factory-contact-source-clarifications -->' -Quiet)) { Add-Content -LiteralPath $clarificationsPath -Value $clarification -Encoding utf8 }

Write-Output 'Contact discovery records, assets, crops, manifest/content map entries, and documentation were updated.'
