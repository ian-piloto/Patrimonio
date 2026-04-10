<?php
require 'api/db.php';
$stmt = $pdo->query("DESCRIBE notificacoes");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
