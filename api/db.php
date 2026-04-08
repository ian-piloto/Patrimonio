<?php
// Configurações do Banco de Dados
$host = '127.0.0.1';
$port = '3306';
$db = 'patrimonio_senai';
$user = 'root'; // Mude se o seu MySQL tiver outro usuário
$pass = ''; // Caso o MySQL no XAMPP tenha senha (ex: root), coloque aqui
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
}
catch (\PDOException $e) {
    // Retorna erro em JSON caso a conexão falhe, útil para nosso Frontend AJAX
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o Banco de Dados: " . $e->getMessage()]);
    exit;
}
?>
