<?php
require_once 'api/db.php';

echo "Database connection successful.\n";

try {
    $stmt = $pdo->query("SELECT id, nome, email, senha FROM usuarios");
    $users = $stmt->fetchAll();
    
    echo "Users found: " . count($users) . "\n";
    foreach ($users as $user) {
        echo "- {$user['nome']} ({$user['email']})\n";
        // Check if 'senai123' works for this user
        if (password_verify('senai123', $user['senha'])) {
            echo "  [OK] Password 'senai123' is CORRECT for this user.\n";
        } else {
            echo "  [FAIL] Password 'senai123' is INCORRECT for this user.\n";
        }
    }
} catch (Exception $e) {
    echo "Error querying database: " . $e->getMessage() . "\n";
}
?>
