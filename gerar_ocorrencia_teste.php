<?php
/**
 * Script de Teste: Gera uma ocorrência de transferência automática
 * para validar o fluxo de aprovação administrativa.
 */
require_once 'api/db.php';

try {
    // 1. Buscar um professor para ser o "solicitante"
    $prof = $pdo->query("SELECT p.id as professor_id, p.usuario_id, s.id as sala_origem_id 
                         FROM professores p 
                         JOIN salas s ON p.id = s.professor_id 
                         LIMIT 1")->fetch();

    if (!$prof) {
        die("Erro: Nenhum professor com sala vinculada encontrado para o teste.");
    }

    // 2. Buscar um patrimônio que esteja na sala desse professor
    $pat = $pdo->prepare("SELECT id, numero_qrcode, nome_descricao FROM patrimonios WHERE sala_atual_id = ? LIMIT 1");
    $pat->execute([$prof['sala_origem_id']]);
    $item = $pat->fetch();

    if (!$item) {
        die("Erro: Nenhum item encontrado na sala do professor para o teste.");
    }

    // 3. Buscar outra sala para ser o destino (que tenha professor)
    $dest = $pdo->prepare("SELECT s.id as sala_destino_id, s.nome_sala, prof.usuario_id as user_dest_id
                           FROM salas s 
                           JOIN professores prof ON s.professor_id = prof.id
                           WHERE s.id != ? LIMIT 1");
    $dest->execute([$prof['sala_origem_id']]);
    $salaDest = $dest->fetch();

    if (!$salaDest) {
        die("Erro: Nenhuma outra sala com professor encontrada para o destino do teste.");
    }

    $pdo->beginTransaction();

    // 4. Inserir a Ocorrência
    $stmt = $pdo->prepare("INSERT INTO ocorrencias (patrimonio_id, sala_encontrada_id, tipo, descricao_problema) VALUES (?, ?, 'Transferência', ?)");
    $stmt->execute([$item['id'], $prof['sala_origem_id'], "Teste automático de transferência via script."]);
    $ocorrencia_id = $pdo->lastInsertId();

    // 5. Notificar o Professor de Destino (Simulando o Aceite)
    $dadosProf = json_encode([
        'type' => 'TRANSFER_REQUEST_PROF',
        'patrimonio_id' => $item['id'],
        'sala_origem_id' => $prof['sala_origem_id'],
        'sala_destino_id' => $salaDest['sala_destino_id'],
        'solicitante_id' => $prof['usuario_id']
    ]);

    $msgProf = "O professor solicitou a transferência do item '{$item['nome_descricao']}' para sua sala ('{$salaDest['nome_sala']}').";
    $stmtNotifProf = $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem, dados_json) VALUES (?, ?, ?, ?)");
    $stmtNotifProf->execute([$salaDest['user_dest_id'], "Solicitação de Transferência (TESTE)", $msgProf, $dadosProf]);

    // 6. Notificar o Admin (Pula a etapa de aceite do prof para o teste ser imediato na aba de transferências)
    $admins = $pdo->query("SELECT id FROM usuarios WHERE tipo = 'admin'")->fetchAll();
    
    // O admin precisa da notificação do tipo 'TRANSFER_EXECUTE_ADMIN' para aparecer na nova tabela
    $dadosAdmin = json_encode([
        'type' => 'TRANSFER_EXECUTE_ADMIN',
        'patrimonio_id' => $item['id'],
        'sala_origem_id' => $prof['sala_origem_id'],
        'sala_destino_id' => $salaDest['sala_destino_id'],
        'solicitante_id' => $prof['usuario_id']
    ]);
    
    $msgAdmin = "TESTE: O professor aceitou a transferência do item '{$item['nome_descricao']}'. Aguardando aprovação final.";
    $stmtAdminNotif = $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem, dados_json) VALUES (?, ?, ?, ?)");
    
    foreach ($admins as $admin) {
        $stmtAdminNotif->execute([$admin['id'], "Efetivar Transferência (TESTE)", $msgAdmin, $dadosAdmin]);
    }

    $pdo->commit();
    echo "Sucesso: Ocorrência de teste ID {$ocorrencia_id} gerada! Verifique a aba de Transferências no painel Admin.";

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo "Erro inesperado: " . $e->getMessage();
}
