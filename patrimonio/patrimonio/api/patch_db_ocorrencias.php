<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE ocorrencias ADD COLUMN tipo ENUM('Transferência', 'Perda', 'Falta de Plaqueta', 'Equipamento Quebrado', 'Outro') DEFAULT 'Outro' AFTER sala_encontrada_id");
    echo "Coluna 'tipo' adicionada com sucesso a tabela 'ocorrencias'.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "A coluna 'tipo' já existe.\n";
    } else {
        echo "Erro: " . $e->getMessage() . "\n";
    }
}
?>
