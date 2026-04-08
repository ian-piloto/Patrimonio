<?php
require_once 'db.php';
try {
    echo "VERIFICAÇÃO FINAL:\n";
    $cols = $pdo->query("DESCRIBE ocorrencias")->fetchAll(PDO::FETCH_COLUMN);
    echo "Ocorrencias: " . implode(', ', $cols) . "\n";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Notificacoes existe: " . (in_array('notificacoes', $tables) ? "SIM" : "NÃO") . "\n";

    echo "TUDO PRONTO PARA TESTE REAL.";
} catch (Exception $e) { echo "ERRO: " . $e->getMessage(); }
?>
