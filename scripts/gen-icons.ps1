[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# 192x192
$bmp = New-Object System.Drawing.Bitmap(192, 192)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(124, 154, 110))), 0, 0, 192, 192)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(153, 168, 201, 127))), 40, 40, 112, 112)
$bmp.Save("F:\git\game\memory-garden\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

# 512x512
$bmp2 = New-Object System.Drawing.Bitmap(512, 512)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g2.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(124, 154, 110))), 0, 0, 512, 512)
$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(128, 168, 201, 127))), 100, 40, 312, 280)
$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(77, 168, 201, 127))), 60, 320, 140, 120)
$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(77, 168, 201, 127))), 320, 300, 120, 100)
$bmp2.Save("F:\git\game\memory-garden\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()

Write-Host "Done: icon-192.png, icon-512.png"
