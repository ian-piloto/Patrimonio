<?php
// Teste de Geração de Notificações de Transferência
require_once __DIR__ . '/../api/db.php';

echo "🧪 Iniciando teste de fluxo de transferência...\n";

try {
    // 1. Setup: Identificar um professor e uma sala que ele cuida
    // Na SEED do database.sql: Prof João (usuario_id 2) cuida da Sala 2 (Informática 2)
    // Vamos transferir algo para a Sala 2.
    $salaDestinoId = 2; // Informática 2 (Prof Maria na verdade, Maria e João cuidam de salas)
    // Correção: Sala 2 -> Prof Maria (usuario_id 3)
    
    echo "Limpando notificações antigas para o destinatário...\n";
    $pdo->prepare("DELETE FROM notificacoes WHERE usuario_destino_id = 3")->execute();

    // 2. Simular a requisição POST para salvar_ocorrencia
    $_POST['action'] = 'salvar_ocorrencia';
    $_POST['patrimonio_id'] = 3; // Notebook Dell Latitude
    $_POST['sala_id'] = 4; // Sala Teórica 10
    $_POST['tipo'] = 'Transferência';
    $_POST['descricao'] = 'Teste automatizado de transferência';
    $_POST['sala_destino_id'] = $salaDestinoId;

    // Simular sessão (Professor João solicitando)
    $_SESSION['usuario_id'] = 2;
    $_SESSION['usuario_nome'] = 'Professor João';

    echo "Chamando logic de salvar_ocorrencia...\n";
    // Como é um script CLI, vamos incluir o routes.php mas capturando o output
    ob_start();
    include __DIR__ . '/../api/routes.php';
    $result = ob_get_clean();
    
    echo "Resultado da API: $result\n";

    // 3. Validar se a notificação foi criada no banco
    echo "Verificando banco de dados...\n";
    $stmt = $pdo->prepare("SELECT * FROM notificacoes WHERE usuario_destino_id = 3 ORDER BY criada_em DESC LIMIT 1");
    $stmt->execute();
    $notif = $stmt->fetch();

    if ($notif) {
        echo "✅ Notificação encontrada!\n";
        echo "Título: {$notif['titulo']}\n";
        echo "Mensagem: {$notif['mensagem']}\n";
        if ($notif['dados_json']) {
            echo "✅ Dados JSON presentes: {$notif['dados_json']}\n";
            $dados = json_decode($notif['dados_json'], true);
            if ($dados['type'] === 'TRANSFER_REQUEST_PROF') {
                echo "✅ Tipo de dados correto (TRANSFER_REQUEST_PROF)\n";
            } else {
                echo "❌ Tipo de dados incorreto: {$dados['type']}\n";
            }
        } else {
            echo "❌ Dados JSON ausentes!\n";
        }
    } else {
        echo "❌ Falha: Nenhuma notificação encontrada para o usuário ID 3.\n";
        
        // Diagnóstico Amigável
        $stmtCheckSala = $pdo->prepare("SELECT professor_id FROM salas WHERE id = ?");
        $stmtCheckSala->execute([$salaDestinoId]);
        $prof = $stmtCheckSala->fetch();
        echo "Diagnóstico -> Professor da sala de destino ($salaDestinoId): " . ($prof['professor_id'] ?? 'NULL') . "\n";
    }

} catch (Exception $e) {
    echo "❌ Erro durante o teste: " . $e->getMessage() . "\n";
}
