<?php
// Script Auxiliar para Inicializar o Banco de Dados a partir do PHP
// Pode ser executado acessando http://localhost/patrimonio/Patrimonio/api/setup.php no navegador
require_once 'db.php';

try {
    $sql = file_get_contents('../database.sql');

    if ($sql !== false) {
        // Habilitar a execução de múltiplos statements caso esteja desabilitado
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
        
        $pdo->exec($sql);
        
        echo "<h1>Banco de dados sincronizado com sucesso!</h1>";
        echo "<p>As tabelas e dados foram restaurados a partir do arquivo database.sql.</p>";
        echo "<br><a href='../index.html' style='padding:10px 20px; background:#28a745; color:white; text-decoration:none; border-radius:5px;'>Ir para o Início</a>";
    }
    else {
        echo "<h1>Erro</h1><p>Não foi possível ler o arquivo database.sql</p>";
    }
}
catch (PDOException $e) {
    echo "<h1>Erro na Execução</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
