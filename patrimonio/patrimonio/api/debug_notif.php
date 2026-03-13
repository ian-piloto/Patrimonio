<?php
require_once 'db.php';

echo "=== DIAGNÓSTICO DE NOTIFICAÇÕES ===\n\n";

// 1. Verificar admins
echo "1. Admins cadastrados:\n";
$admins = $pdo->query("SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'admin'")->fetchAll();
foreach ($admins as $a) {
    echo "   ID={$a['id']}, Nome={$a['nome']}, Email={$a['email']}\n";
}

// 2. Verificar notificações existentes
echo "\n2. Todas as notificações:\n";
$notifs = $pdo->query("SELECT n.id, n.usuario_destino_id, n.titulo, n.lida, n.criada_em, u.nome as dest_nome FROM notificacoes n JOIN usuarios u ON n.usuario_destino_id = u.id ORDER BY n.criada_em DESC")->fetchAll();
if (empty($notifs)) {
    echo "   NENHUMA notificação encontrada!\n";
} else {
    foreach ($notifs as $n) {
        echo "   ID={$n['id']}, Para: {$n['dest_nome']} (user_id={$n['usuario_destino_id']}), Titulo: {$n['titulo']}, Lida: {$n['lida']}, Data: {$n['criada_em']}\n";
    }
}

// 3. Verificar ocorrências
echo "\n3. Últimas ocorrências:\n";
$ocs = $pdo->query("SELECT id, patrimonio_id, sala_encontrada_id, data_ocorrencia FROM ocorrencias ORDER BY data_ocorrencia DESC LIMIT 5")->fetchAll();
if (empty($ocs)) {
    echo "   NENHUMA ocorrência encontrada!\n";
} else {
    foreach ($ocs as $o) {
        echo "   ID={$o['id']}, patrimonio={$o['patrimonio_id']}, sala={$o['sala_encontrada_id']}, data={$o['data_ocorrencia']}\n";
    }
}

echo "\n=== FIM DIAGNÓSTICO ===\n";
?>
