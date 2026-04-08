<?php
$password = 'senai123';

echo "Password: $password\n";

// Now update the database with this specific password
require_once 'api/db.php';
$stmt = $pdo->prepare("UPDATE usuarios SET senha = ?");
$stmt->execute([$password]);
echo "Database updated with plain password 'senai123'.\n";
?>
