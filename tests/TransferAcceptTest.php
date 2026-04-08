<?php
// Teste de Resposta à Transferência (Aceite do Professor)
require_once __DIR__ . '/../api/db.php';

echo "🧪 Iniciando teste de ACEITE de transferência...\n";

try {
    // 1. Setup: Pegar a última notificação para a Prof Maria (usuario_id 3)
    $stmt = $pdo->prepare("SELECT id FROM notificacoes WHERE usuario_destino_id = 3 ORDER BY criada_em DESC LIMIT 1");
    $stmt->execute();
    $notif = $stmt->fetch();

    if (!$notif) throw new Exception("Nenhuma notificação encontrada para testar aceite.");
    
    $notifId = $notif['id'];
    echo "Testando com Notificação ID: $notifId\n";

    // 2. Simular Resposta
    $_POST['action'] = 'responder_transferencia';
    $_POST['notificacao_id'] = $notifId;
    $_POST['resposta'] = 'aceitar';

    // Simular sessão (Professora Maria logada)
    $_SESSION['usuario_id'] = 3;

    ob_start();
    include __DIR__ . '/../api/routes.php';
    $result = ob_get_clean();
    echo "Resultado da API: $result\n";

    // 3. Validar se a notificação para Admin foi criada
    // Admins na base seed: Admin (usuario_id 1)
    $stmtAdmin = $pdo->prepare("SELECT * FROM notificacoes WHERE usuario_destino_id = 1 ORDER BY criada_em DESC LIMIT 1");
    $stmtAdmin->execute();
    $notifAdmin = $stmtAdmin->fetch();

    if ($notifAdmin && strpos($notifAdmin['dados_json'], 'TRANSFER_EXECUTE_ADMIN') !== false) {
        echo "✅ Notificação para Admin gerada com sucesso!\n";
    } else {
        echo "❌ Falha: Notificação para Admin não encontrada ou inválida.\n";
    }

} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
