<?php
require_once 'api/db.php';

try {
    $stmt = $pdo->query("SELECT email, senha FROM usuarios");
    while ($row = $stmt->fetch()) {
        echo "Email: {$row['email']}\n";
        echo "Hash: {$row['senha']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
