<?php
require_once 'c:/xampp/htdocs/patrimonio/patrimonio/api/db.php';

$nome = 'Professor Teste';
$email = 'professor@senai.br';
$senha_plana = '123456';
$tipo = 'professor';
$senha_hash = password_hash($senha_plana, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE senha=?, tipo=?");
    $stmt->execute([$nome, $email, $senha_hash, $tipo, $senha_hash, $tipo]);
    echo "Usuário professor criado/atualizado com sucesso!\nEmail: $email\nSenha: $senha_plana";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
