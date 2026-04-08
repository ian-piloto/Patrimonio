<?php
$f = fopen('C:/xampp/htdocs/patrimonio/patrimonio/patrimonio/PATRIMONIO_FORMATADO.csv', 'r');
$data = [];
if ($f) {
    for($i=0; $i<15; $i++) {
        $row = fgetcsv($f, 0, ';');
        if($row) {
            $data[] = array_map('trim', $row);
        }
    }
    fclose($f);
    file_put_contents('C:/xampp/htdocs/patrimonio/patrimonio/patrimonio/test_excel.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Success";
} else {
    echo "Failed to open";
}
?>
