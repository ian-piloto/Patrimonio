<?php
session_start();
header('Content-Type: application/json');
require_once 'api/db.php';

$userId = $_SESSION['usuario_id'] ?? null;
$userData = null;
$profData = null;

if ($userId) {
    $stmtUser = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userData = $stmtUser->fetch();

    $stmtProf = $pdo->prepare("SELECT * FROM professores WHERE usuario_id = ?");
    $stmtProf->execute([$userId]);
    $profData = $stmtProf->fetch();
}

echo json_encode([
    "session" => $_SESSION,
    "user_db" => $userData,
    "professor_db" => $profData,
    "all_professores" => $pdo->query("SELECT * FROM professores")->fetchAll()
], JSON_PRETTY_PRINT);
?>
