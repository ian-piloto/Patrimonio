<?php
require_once 'db.php';
try {
    echo "--- FORCE RESET START ---\n";
    
    // Tentar dropar
    try {
        $pdo->exec("ALTER TABLE ocorrencias DROP COLUMN tipo");
        echo "OK: Coluna 'tipo' removida (estava lá afinal?)\n";
    } catch (Exception $e) {
        echo "INFO: Falha ao remover 'tipo': " . $e->getMessage() . "\n";
    }

    // Tentar adicionar de novo
    try {
        $pdo->exec("ALTER TABLE ocorrencias ADD COLUMN tipo VARCHAR(50) NOT NULL AFTER sala_encontrada_id");
        echo "OK: Coluna 'tipo' adicionada com sucesso!\n";
    } catch (Exception $e) {
        echo "ERROR ao adicionar 'tipo': " . $e->getMessage() . "\n";
    }

    // Verificar agora
    $cols = $pdo->query("DESCRIBE ocorrencias")->fetchAll(PDO::FETCH_COLUMN);
    echo "Colunas finais: " . implode(', ', $cols) . "\n";

} catch (Exception $e) { echo "CRITICAL ERROR: " . $e->getMessage(); }
?>
