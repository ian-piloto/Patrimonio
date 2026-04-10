<?php
require 'api/db.php';
try {
    $pdo->exec("ALTER TABLE notificacoes ADD COLUMN resultado_acao VARCHAR(20) DEFAULT NULL");
    echo "Sucesso: Coluna 'resultado_acao' adicionada à tabela notificacoes.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Aviso: A coluna já existe.\n";
    } else {
        echo "Erro: " . $e->getMessage() . "\n";
    }
}
