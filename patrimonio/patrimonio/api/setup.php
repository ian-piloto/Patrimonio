<?php
// Script Auxiliar para Inicializar o Banco de Dados a partir do PHP
// Pode ser executado acessando http://localhost/patrimonio/api/setup.php no navegador
require_once 'db.php';

try {
    $sql = file_get_contents('../database.sql');

    if ($sql !== false) {
        $pdo->exec($sql);
        echo "<h1>Banco de dados inicializado com sucesso!</h1>";
        echo "<p>As tabelas foram criadas e os dados de teste inseridos.</p>";
        echo "<a href='../index.html'>Voltar para o sistema</a>";
    }
    else {
        echo "Erro ao ler o arquivo database.sql";
    }
}
catch (PDOException $e) {
    echo "Erro na execução do script SQL: " . $e->getMessage();
}
?>
