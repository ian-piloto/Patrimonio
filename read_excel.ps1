$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
try {
    $Workbook = $Excel.Workbooks.Open('C:\xampp\htdocs\patrimonio\Patrimonio\patrimonio\patrimonio\Patrimonio BLOCO C1 - BRUNO.xlsx')
    $Worksheet = $Workbook.Sheets.Item(1)
    $MaxRows = 50
    $MaxCols = 13
    $Rows = @()
    for($r=1; $r -le $MaxRows; $r++) {
        $Cells = @()
        for($c=1; $c -le $MaxCols; $c++) {
            $val = $Worksheet.Cells.Item($r, $c).Text
            $Cells += $val
        }
        $Rows += ($Cells -join ";")
    }
    $Rows | Out-File -FilePath 'C:\xampp\htdocs\patrimonio\Patrimonio\patrimonio\patrimonio\excel_sample.txt' -Encoding UTF8
    $Workbook.Close($false)
} finally {
    $Excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
