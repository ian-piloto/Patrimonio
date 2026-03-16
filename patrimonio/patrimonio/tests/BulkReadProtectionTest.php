<?php
require_once __DIR__ . '/../api/db.php';

echo "🧪 Teste de Bulk Mark as Read vs Actionable Notifications\n";

try {
    $userId = 3; // Maria
    
    // 1. Criar uma notificação actionable
    $dados = json_encode(['type' => 'TRANSFER_REQUEST_PROF', 'patrimonio_id' => 1]);
    $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem, dados_json) VALUES (?, 'Teste', 'Msg', ?)")->execute([$userId, $dados]);
    $actionId = $pdo->lastInsertId();

    // 2. Criar uma notificação comum (sem dados_json)
    $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem) VALUES (?, 'Comum', 'Msg Comum')")->execute([$userId]);
    $comumId = $pdo->lastInsertId();

    echo "Criadas: Actionable ($actionId), Comum ($comumId)\n";

    // 3. Chamar marcar_notificacoes_lidas
    $_POST['action'] = 'marcar_notificacoes_lidas';
    $_SESSION['usuario_id'] = $userId;
    
    ob_start();
    include __DIR__ . '/../api/routes.php';
    ob_get_clean();

    // 4. Verificar status
    $stmt = $pdo->prepare("SELECT id, lida FROM notificacoes WHERE id IN (?, ?)");
    $stmt->execute([$actionId, $comumId]);
    $results = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    if ($results[$comumId] == 1 && $results[$actionId] == 0) {
        echo "✅ SUCESSO: Notificação comum foi lida, Actionable continua não-lida.\n";
    } else {
        echo "❌ FALHA: Comum: {$results[$comumId]}, Actionable: {$results[$actionId]}\n";
    }

    // Limpeza
    $pdo->prepare("DELETE FROM notificacoes WHERE id IN (?, ?)")->execute([$actionId, $comumId]);

} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
