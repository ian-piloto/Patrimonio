<?php
try {
    include 'db.php';
    echo "Conexão estabelecida com sucesso!";
} catch (Exception $e) {
    echo "Falha na conexão: " . $e->getMessage();
}
?>
