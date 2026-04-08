<?php
require_once 'db.php';
header('Content-Type: text/plain');

try {
    echo "--- LISTA DE NOTIFICAÇÕES ---\n";
    $stmt = $pdo->query("
        SELECT n.*, u.nome as destinatario, u.tipo as tipo_usuario
        FROM notificacoes n
        JOIN usuarios u ON n.usuario_destino_id = u.id
        ORDER BY n.criada_em DESC
        LIMIT 20
    ");
    $notificacoes = $stmt->fetchAll();

    foreach ($notificacoes as $n) {
        echo "ID: {$n['id']} | Dest: {$n['destinatario']} ({$n['tipo_usuario']}) | Título: {$n['titulo']} | Lida: {$n['lida']}\n";
        echo "Mensagem: {$n['mensagem']}\n";
        echo "Dados: {$n['dados_json']}\n";
        echo "--------------------------------------------------\n";
    }
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
