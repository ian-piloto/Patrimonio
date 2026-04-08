<?php
$html = file_get_contents('C:/xampp/htdocs/patrimonio/patrimonio/patrimonio/excel_export_arquivos/sheet001.htm');
$dom = new DOMDocument();
@$dom->loadHTML($html);
$rows = $dom->getElementsByTagName('tr');
$data = [];
$count=0;
foreach ($rows as $row) {
    if ($count++ > 10) break;
    $cells = $row->getElementsByTagName('td');
    $rowData = [];
    foreach ($cells as $cell) {
        $rowData[] = trim($cell->textContent);
    }
    // Remove empty trailing columns
    while (!empty($rowData) && end($rowData) === '') array_pop($rowData);
    $data[] = $rowData;
}
file_put_contents('C:/xampp/htdocs/patrimonio/patrimonio/patrimonio/parsed_excel.json', json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
echo "DONE";
?>
