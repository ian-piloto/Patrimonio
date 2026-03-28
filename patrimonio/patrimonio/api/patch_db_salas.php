<?php
require_once 'db.php';

try {
    $pdo->beginTransaction();

    // Remove todos os vínculos de professores que estão repetidos
    $pdo->exec("UPDATE salas SET professor_id = NULL");

    // Atribui os professores 1, 2, 3 e 4 para as salas 1, 2, 3 e 6
    $pdo->exec("UPDATE salas SET professor_id = 1 WHERE id = 1");
    $pdo->exec("UPDATE salas SET professor_id = 2 WHERE id = 2");
    $pdo->exec("UPDATE salas SET professor_id = 3 WHERE id = 3");
    $pdo->exec("UPDATE salas SET professor_id = 4 WHERE id = 6");

    $pdo->commit();
    echo "As salas foram atualizadas! Cada professor agora está vinculado a apenas uma sala (Prof 1 = Sala 1, Prof 2 = Sala 2, Prof 3 = Sala 3, Prof 4 = Sala 6).";
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Erro ao atualizar: " . $e->getMessage();
}
?>
