<?php
require_once 'db.php';
echo "BLUNT PATCH START\n";
try {
    // Tentar adicionar a coluna ignorando se já existir
    try {
        $pdo->exec("ALTER TABLE ocorrencias ADD COLUMN tipo VARCHAR(50) NOT NULL AFTER sala_encontrada_id");
        echo "OK: Coluna 'tipo' adicionada.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "INFO: Coluna 'tipo' já existe.\n";
        } else {
            throw $e;
        }
    }

    // Tentar criar a tabela notificações
    $pdo->exec("CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_destino_id INT NOT NULL,
        titulo VARCHAR(100) NOT NULL,
        mensagem TEXT NOT NULL,
        lida BOOLEAN DEFAULT FALSE,
        criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )");
    echo "OK: Tabela 'notificacoes' verificada.\n";

    echo "PATCH SUCCESSFUL\n";
} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}
?>
