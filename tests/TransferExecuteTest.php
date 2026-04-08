<?php
// Teste de Efetivação de Transferência (Ação do Admin)
require_once __DIR__ . '/../api/db.php';

echo "🧪 Iniciando teste de EFETIVAÇÃO de transferência...\n";

try {
    // 1. Setup: Pegar a última notificação para o Admin (usuario_id 1)
    $stmt = $pdo->prepare("SELECT id, dados_json FROM notificacoes WHERE usuario_destino_id = 1 AND titulo = 'Efetivar Transferência' ORDER BY criada_em DESC LIMIT 1");
    $stmt->execute();
    $notif = $stmt->fetch();

    if (!$notif) throw new Exception("Nenhuma notificação de efetivação encontrada para o Admin.");
    
    $notifId = $notif['id'];
    $dados = json_decode($notif['dados_json'], true);
    $patrimonioId = $dados['patrimonio_id'];
    $salaDestinoId = $dados['sala_destino_id'];

    echo "Efetivando transferência do Patrimônio ID $patrimonioId para Sala ID $salaDestinoId\n";

    // 2. Simular Resposta do Admin
    $_POST['action'] = 'executar_transferencia_admin';
    $_POST['notificacao_id'] = $notifId;

    // Simular sessão (Admin logado)
    $_SESSION['usuario_id'] = 1;

    ob_start();
    include __DIR__ . '/../api/routes.php';
    $result = ob_get_clean();
    echo "Resultado da API: $result\n";

    // 3. Validar se o patrimônio mudou de sala
    $stmtCheck = $pdo->prepare("SELECT sala_atual_id FROM patrimonios WHERE id = ?");
    $stmtCheck->execute([$patrimonioId]);
    $pat = $stmtCheck->fetch();

    if ($pat['sala_atual_id'] == $salaDestinoId) {
        echo "✅ SUCESSO! Patrimônio movido para a sala de destino.\n";
    } else {
        echo "❌ FALHA: Patrimônio continua na sala antiga ($pat[sala_atual_id]).\n";
    }

    // 4. Validar se registrou no histórico (emprestimos)
    $stmtHist = $pdo->prepare("SELECT * FROM emprestimos WHERE patrimonio_id = ? ORDER BY data_emprestimo DESC LIMIT 1");
    $stmtHist->execute([$patrimonioId]);
    $hist = $stmtHist->fetch();

    if ($hist && $hist['sala_destino_id'] == $salaDestinoId) {
        echo "✅ SUCESSO! Histórico de transferência registrado.\n";
    } else {
        echo "❌ FALHA: Histórico não encontrado ou incorreto.\n";
    }

} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
