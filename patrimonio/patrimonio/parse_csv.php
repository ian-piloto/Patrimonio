<?php
$f = fopen('C:/xampp/htdocs/patrimonio/patrimonio/patrimonio/PATRIMONIO_FORMATADO.csv', 'r');
if ($f) {
    for($i=0; $i<5; $i++) {
        $row = fgetcsv($f, 0, ';');
        if($row) { print_r($row); }
    }
    fclose($f);
}
?>
