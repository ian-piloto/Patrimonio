<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE notificacoes ADD COLUMN dados_json TEXT AFTER mensagem");
    echo "Sucesso: Coluna dados_json adicionada.";
} catch (Exception $e) {
    echo "Aviso ou Erro: " . $e->getMessage();
}
?>
