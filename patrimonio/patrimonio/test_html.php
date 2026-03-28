<?php
$html = file_get_contents('C:\xampp\htdocs\patrimonio\patrimonio\patrimonio\excel_export_arquivos\sheet001.htm');
$dom = new DOMDocument();
@$dom->loadHTML($html);
$rows = $dom->getElementsByTagName('tr');
$data = [];
$count = 0;
foreach ($rows as $row) {
    if ($count++ > 5) break;
    $cells = $row->getElementsByTagName('td');
    $rowData = [];
    foreach ($cells as $cell) {
        $rowData[] = trim($cell->textContent);
    }
    // apenas remove colunas completamente vazias do final, mas mantem os dados
    $data[] = $rowData;
}
print_r($data);
?>
