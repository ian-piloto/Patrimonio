<?php
require_once 'c:/xampp/htdocs/patrimonio/patrimonio/api/db.php';

$nome = 'Professor Teste';
$email = 'professor@senai.br';
$senha_plana = '123456';
$tipo = 'professor';

try {
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE senha=?, tipo=?");
    $stmt->execute([$nome, $email, $senha_plana, $tipo, $senha_plana, $tipo]);
    echo "Usuário professor criado/atualizado com sucesso (Modo Sem Criptografia)!\nEmail: $email\nSenha: $senha_plana";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
