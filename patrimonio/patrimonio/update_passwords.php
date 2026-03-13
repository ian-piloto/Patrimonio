<?php
require_once 'api/db.php';

$new_hash = '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUEN'; // senai123

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET senha = ?");
    $stmt->execute([$new_hash]);
    echo "Successfully updated " . $stmt->rowCount() . " users with password 'senai123'.\n";
} catch (Exception $e) {
    echo "Error updating passwords: " . $e->getMessage() . "\n";
}
?>
