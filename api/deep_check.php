<?php
require_once 'db.php';
try {
    echo "--- DEEP SCHEMA INSPECTION ---\n";
    $stmt = $pdo->query("SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'ocorrencias'");
    while ($row = $stmt->fetch()) {
        echo "Schema: {$row['TABLE_SCHEMA']} | Table: {$row['TABLE_NAME']} | Column: {$row['COLUMN_NAME']}\n";
    }
} catch (Exception $e) { echo "Error: " . $e->getMessage(); }
?>
