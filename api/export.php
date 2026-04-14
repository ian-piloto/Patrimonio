<?php
/**
 * Script de Exportação do Banco de Dados
 * Responsável por gerar o arquivo database.sql sincronizado com o estado atual do MySQL.
 */
require_once 'db.php';

// Nome do arquivo de saída
$outputFile = '../database.sql';

try {
    $sqlContent = "-- Sistema de Gestão de Patrimônios SENAI\n";
    $sqlContent .= "-- Snapshot Gerado Automaticamente em: " . date('Y-m-d H:i:s') . "\n\n";
    
    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 0;\n";
    $sqlContent .= "DROP DATABASE IF EXISTS $db;\n";
    $sqlContent .= "CREATE DATABASE $db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
    $sqlContent .= "USE $db;\n\n";

    // Listar todas as tabelas
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    foreach ($tables as $table) {
        // Estrutura da Tabela
        $sqlContent .= "-- Estrutura da tabela `$table` --\n";
        $stmtCreate = $pdo->query("SHOW CREATE TABLE `$table` ");
        $rowCreate = $stmtCreate->fetch(PDO::FETCH_ASSOC);
        $sqlContent .= $rowCreate['Create Table'] . ";\n\n";

        // Dados da Tabela
        $stmtData = $pdo->query("SELECT * FROM `$table` ");
        $rowsData = $stmtData->fetchAll(PDO::FETCH_ASSOC);

        if (count($rowsData) > 0) {
            $sqlContent .= "-- Dados da tabela `$table` --\n";
            foreach ($rowsData as $row) {
                $columns = array_keys($row);
                $values = array_values($row);
                
                // Tratar valores (escapar strings, tratar NULL)
                $escapedValues = array_map(function($val) use ($pdo) {
                    if ($val === null) return 'NULL';
                    return $pdo->quote($val);
                }, $values);

                $sqlContent .= "INSERT INTO `$table` (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
            }
            $sqlContent .= "\n";
        }
    }

    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 1;\n";

    // Salvar no arquivo
    if (file_put_contents($outputFile, $sqlContent)) {
        header('Content-Type: text/html; charset=utf-8');
        echo "<h1>Exportação Concluída!</h1>";
        echo "<p>O arquivo <strong>database.sql</strong> foi atualizado com sucesso.</p>";
        echo "<p>Agora você pode fazer o <strong>Commit</strong> e <strong>Push</strong> no seu GitHub.</p>";
        echo "<br><a href='../index.html' style='padding:10px 20px; background:#007bff; color:white; text-decoration:none; border-radius:5px;'>Voltar para o Sistema</a>";
    } else {
        throw new Exception("Não foi possível escrever no arquivo $outputFile. Verifique as permissões de pasta.");
    }

} catch (Exception $e) {
    echo "<h1>Erro na Exportação</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
