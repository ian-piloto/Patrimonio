<?php
require_once 'db.php';
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notificacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_destino_id INT NOT NULL,
            titulo VARCHAR(150) NOT NULL,
            mensagem TEXT,
            lida BOOLEAN DEFAULT FALSE,
            criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    ");
    echo "Tabela 'notificacoes' criada com sucesso.\n";
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
