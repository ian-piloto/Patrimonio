<?php
$password = 'senai123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: $password\n";
echo "Hash: $hash\n";

if (password_verify($password, $hash)) {
    echo "VERIFICATION SUCCESS: Hash matches password.\n";
    
    // Now update the database with this specific hash
    require_once 'api/db.php';
    $stmt = $pdo->prepare("UPDATE usuarios SET senha = ?");
    $stmt->execute([$hash]);
    echo "Database updated with verified hash.\n";
} else {
    echo "VERIFICATION FAILED: Something is very wrong with password_hash/verify.\n";
}
?>
