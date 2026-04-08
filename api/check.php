<?php
require_once 'db.php';
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tabelas: " . implode(', ', $tables) . "\n";
    if (in_array('ocorrencias', $tables)) {
        $cols = $pdo->query("DESCRIBE ocorrencias")->fetchAll(PDO::FETCH_COLUMN);
        echo "Colunas ocorrencias: " . implode(', ', $cols) . "\n";
    }
} catch (Exception $e) { echo "Erro: " . $e->getMessage(); }
?>
