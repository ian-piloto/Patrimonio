<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

// Bloqueio de acesso para quem não estiver logado (comentado para facilitar primeiros acessos, ative se necessário)
/*if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["status" => "error", "message" => "Não autorizado. Faça o login."]);
    exit;
}*/

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {

        // 1. DADOS DE CADASTROS (SELECTS)
        case 'get_salas':
            // Pega as salas e o nome do professor responsável, se houver
            $stmt = $pdo->query("
                SELECT s.id, s.nome_sala, p.nome as nome_professor 
                FROM salas s 
                LEFT JOIN professores p ON s.professor_id = p.id
                ORDER BY s.nome_sala
            ");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        case 'get_professores':
            $stmt = $pdo->query("SELECT id, nome FROM professores ORDER BY nome");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        case 'get_categorias':
            $stmt = $pdo->query("SELECT id, nome FROM categorias_patrimonio ORDER BY nome");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        case 'cadastrar_sala':
            $nome_sala = trim($_POST['nome_sala'] ?? '');

            if (empty($nome_sala)) {
                throw new Exception("O nome da sala é obrigatório.");
            }

            // Evitar duplicidade de nome de sala
            $stmt = $pdo->prepare("SELECT id FROM salas WHERE nome_sala = ?");
            $stmt->execute([$nome_sala]);
            if ($stmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Já existe uma sala com o nome '{$nome_sala}'."]);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO salas (nome_sala) VALUES (?)");
            $stmt->execute([$nome_sala]);

            echo json_encode([
                "status" => "success",
                "message" => "Sala '{$nome_sala}' cadastrada com sucesso!"
            ]);
            break;

        // 2. VÍNCULO DE PROFESSOR E SALA
        case 'vincular_sala':
            $sala_id = $_POST['sala_id'] ?? null;
            $professor_id = $_POST['professor_id'] ?? null;

            if (!$sala_id || !$professor_id)
                throw new Exception("Sala e Professor são obrigatórios.");

            $stmt = $pdo->prepare("UPDATE salas SET professor_id = ? WHERE id = ?");
            $stmt->execute([$professor_id, $sala_id]);
            echo json_encode(["status" => "success", "message" => "Vínculo atualizado com sucesso."]);
            break;

        // 3. LEITURA E GESTÃO DE PATRIMÔNIO (QR CODE)
        case 'buscar_patrimonio':
            // Busca o patrimônio através da string do QR Code
            $qrcode = $_GET['qrcode'] ?? '';
            $stmt = $pdo->prepare("
                SELECT p.id, p.numero_qrcode, p.nome_descricao, c.nome as categoria, s.nome_sala, p.sala_atual_id 
                FROM patrimonios p
                JOIN categorias_patrimonio c ON p.categoria_id = c.id
                JOIN salas s ON p.sala_atual_id = s.id
                WHERE p.numero_qrcode = ?
            ");
            $stmt->execute([$qrcode]);
            $patrimonio = $stmt->fetch();

            if ($patrimonio)
                echo json_encode(["status" => "success", "data" => $patrimonio]);
            else
                echo json_encode(["status" => "error", "message" => "Patrimônio não encontrado."]);
            break;

        case 'listar_patrimonios_da_sala':
            $sala_id = $_GET['sala_id'] ?? null;
            $stmt = $pdo->prepare("
                SELECT p.id, p.numero_qrcode, p.nome_descricao, c.nome as categoria, 
                       s.nome_sala, prof.nome as nome_professor
                FROM patrimonios p
                JOIN categorias_patrimonio c ON p.categoria_id = c.id
                JOIN salas s ON p.sala_atual_id = s.id
                LEFT JOIN professores prof ON s.professor_id = prof.id
                WHERE p.sala_atual_id = ?
            ");
            $stmt->execute([$sala_id]);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        // 3.5 CADASTRO DE PATRIMÔNIO
        case 'cadastrar_patrimonio':
            $qrcode = $_POST['qrcode'] ?? '';
            $nome = $_POST['nome'] ?? '';
            $categoria_id = $_POST['categoria_id'] ?? null;
            $sala_id = $_POST['sala_id'] ?? null;

            if (empty($qrcode) || empty($nome) || !$categoria_id || !$sala_id) {
                throw new Exception("Todos os campos do formulário são obrigatórios.");
            }

            // Verifica duplicidade do QR Code
            $stmt = $pdo->prepare("SELECT id FROM patrimonios WHERE numero_qrcode = ?");
            $stmt->execute([$qrcode]);
            if ($stmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "O código QR '{$qrcode}' já se encontra cadastrado."]);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO patrimonios (numero_qrcode, nome_descricao, categoria_id, sala_atual_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$qrcode, $nome, $categoria_id, $sala_id]);
            echo json_encode(["status" => "success", "message" => "Patrimônio cadastrado com sucesso!"]);
            break;

        // 4. OCORRÊNCIAS (ITENS FORA DO LUGAR)
        case 'salvar_ocorrencia':
            $patrimonio_id = $_POST['patrimonio_id'] ?? null;
            $sala_encontrada = $_POST['sala_id'] ?? null;
            $tipo = $_POST['tipo'] ?? 'Outro';
            $descricao = $_POST['descricao'] ?? null;
            $sala_destino_id = $_POST['sala_destino_id'] ?? null;

            if (!$patrimonio_id || !$sala_encontrada || !$tipo)
                throw new Exception("Dados incompletos para ocorrência.");

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO ocorrencias (patrimonio_id, sala_encontrada_id, tipo, descricao_problema) VALUES (?, ?, ?, ?)");
            $stmt->execute([$patrimonio_id, $sala_encontrada, $tipo, $descricao]);

            // Dados básicos para notificação
            $stmtDetails = $pdo->prepare("
                SELECT p.nome_descricao, p.numero_qrcode, s.nome_sala as sala_origem 
                FROM patrimonios p 
                JOIN salas s ON p.sala_atual_id = s.id 
                WHERE p.id = ?
            ");
            $stmtDetails->execute([$patrimonio_id]);
            $details = $stmtDetails->fetch();

            if ($tipo === 'Transferência' && $sala_destino_id) {
                // Em vez de mover, notifica o professor da sala de destino
                $stmtSalaDest = $pdo->prepare("SELECT professor_id, nome_sala FROM salas WHERE id = ?");
                $stmtSalaDest->execute([$sala_destino_id]);
                $salaDest = $stmtSalaDest->fetch();

                if ($salaDest && $salaDest['professor_id']) {
                    // Notifica o professor da sala de destino através do usuario_id vinculado
                    $stmtUser = $pdo->prepare("SELECT usuario_id FROM professores WHERE id = ?");
                    $stmtUser->execute([$salaDest['professor_id']]);
                    $userDest = $stmtUser->fetch();

                    if ($userDest) {
                        $dados = json_encode([
                            'type' => 'TRANSFER_REQUEST_PROF',
                            'patrimonio_id' => $patrimonio_id,
                            'sala_origem_id' => $sala_encontrada,
                            'sala_destino_id' => $sala_destino_id
                        ]);
                        
                        $msg = "O professor da sala '{$details['sala_origem']}' solicitou a transferência do item '{$details['nome_descricao']}' ({$details['numero_qrcode']}) para sua sala ('{$salaDest['nome_sala']}'). Você aceita?";
                        
                        $stmtNotif = $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem, dados_json) VALUES (?, ?, ?, ?)");
                        $stmtNotif->execute([$userDest['usuario_id'], "Solicitação de Transferência", $msg, $dados]);
                    }
                }
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Ocorrência registrada com sucesso!"]);
            break;

        case 'responder_transferencia':
            $notificacao_id = $_POST['notificacao_id'] ?? null;
            $resposta = $_POST['resposta'] ?? ''; // 'aceitar' ou 'recusar'

            if (!$notificacao_id) throw new Exception("ID da notificação obrigatório.");

            $pdo->beginTransaction();

            $stmtNotif = $pdo->prepare("SELECT * FROM notificacoes WHERE id = ?");
            $stmtNotif->execute([$notificacao_id]);
            $notif = $stmtNotif->fetch();

            if (!$notif || !$notif['dados_json']) throw new Exception("Notificação inválida.");

            $dados = json_decode($notif['dados_json'], true);
            $userId = $_SESSION['usuario_id'];

            if ($resposta === 'aceitar') {
                // Notifica Admin
                $admins = $pdo->query("SELECT id FROM usuarios WHERE tipo = 'admin'")->fetchAll();
                $stmtAdminNotif = $pdo->prepare("INSERT INTO notificacoes (usuario_destino_id, titulo, mensagem, dados_json) VALUES (?, ?, ?, ?)");
                
                $dadosAdmin = json_encode(array_merge($dados, ['type' => 'TRANSFER_EXECUTE_ADMIN']));
                $msgAdmin = "O professor aceitou a transferência do patrimônio ID {$dados['patrimonio_id']}. Clique para efetivar.";

                foreach ($admins as $admin) {
                    $stmtAdminNotif->execute([$admin['id'], "Efetivar Transferência", $msgAdmin, $dadosAdmin]);
                }
            }

            // Marca notificação atual como lida
            $pdo->prepare("UPDATE notificacoes SET lida = 1 WHERE id = ?")->execute([$notificacao_id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Resposta registrada!"]);
            break;

        case 'executar_transferencia_admin':
            $notificacao_id = $_POST['notificacao_id'] ?? null;
            if (!$notificacao_id) throw new Exception("ID da notificação obrigatório.");

            $pdo->beginTransaction();

            $stmtNotif = $pdo->prepare("SELECT * FROM notificacoes WHERE id = ?");
            $stmtNotif->execute([$notificacao_id]);
            $notif = $stmtNotif->fetch();

            $dados = json_decode($notif['dados_json'], true);

            // Move o patrimônio
            $stmtMove = $pdo->prepare("UPDATE patrimonios SET sala_atual_id = ? WHERE id = ?");
            $stmtMove->execute([$dados['sala_destino_id'], $dados['patrimonio_id']]);

            // Registra histórico
            $stmtHist = $pdo->prepare("INSERT INTO emprestimos (patrimonio_id, sala_origem_id, sala_destino_id) VALUES (?, ?, ?)");
            $stmtHist->execute([$dados['patrimonio_id'], $dados['sala_origem_id'], $dados['sala_destino_id']]);

            // Marca lida
            $pdo->prepare("UPDATE notificacoes SET lida = 1 WHERE id = ?")->execute([$notificacao_id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Transferência concluída com sucesso!"]);
            break;

        case 'listar_ocorrencias':
            $stmt = $pdo->query("
                SELECT o.id, o.data_ocorrencia, o.status, p.nome_descricao, p.numero_qrcode, s.nome_sala as encontrada_em
                FROM ocorrencias o
                JOIN patrimonios p ON o.patrimonio_id = p.id
                JOIN salas s ON o.sala_encontrada_id = s.id
                ORDER BY o.data_ocorrencia DESC
            ");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        // 5. EMPRÉSTIMOS DE ITENS ENTRE SALAS
        case 'registrar_emprestimo':
            $patrimonio_id = $_POST['patrimonio_id'] ?? null;
            $sala_origem = $_POST['sala_origem_id'] ?? null;
            $sala_destino = $_POST['sala_destino_id'] ?? null;

            if (!$patrimonio_id || !$sala_origem || !$sala_destino)
                throw new Exception("Dados incompletos para o empréstimo.");

            $pdo->beginTransaction();
            // Registra histórico no DB
            $stmt = $pdo->prepare("INSERT INTO emprestimos (patrimonio_id, sala_origem_id, sala_destino_id) VALUES (?, ?, ?)");
            $stmt->execute([$patrimonio_id, $sala_origem, $sala_destino]);
            // Atualiza local físico real 
            $stmt2 = $pdo->prepare("UPDATE patrimonios SET sala_atual_id = ? WHERE id = ?");
            $stmt2->execute([$sala_destino, $patrimonio_id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Empréstimo registrado. Patrimônio movido!"]);
            break;

        // 6. NOTIFICAÇÕES
        case 'get_notificacoes':
            $userId = $_SESSION['usuario_id'] ?? null;
            if (!$userId) {
                echo json_encode(["status" => "success", "data" => []]);
                break;
            }
            $stmt = $pdo->prepare("
                SELECT id, titulo, mensagem, dados_json, lida, criada_em
                FROM notificacoes
                WHERE usuario_destino_id = ?
                ORDER BY criada_em DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        case 'marcar_notificacoes_lidas':
            $userId = $_SESSION['usuario_id'] ?? null;
            if (!$userId) throw new Exception("Não autorizado.");
            // Marca como lidas apenas notificações que NÃO possuem dados de ação (botões)
            $pdo->prepare("UPDATE notificacoes SET lida = TRUE WHERE usuario_destino_id = ? AND (dados_json IS NULL OR dados_json = '')")->execute([$userId]);
            echo json_encode(["status" => "success", "message" => "Notificações marcadas como lidas."]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Ação não especificada ou inválida."]);
    }

}
catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
