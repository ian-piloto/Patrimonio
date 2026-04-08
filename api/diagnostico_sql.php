<?php
require_once 'db.php';

header('Content-Type: text/plain');

echo "--- DIAGNÓSTICO DE BANCO DE DADOS ---\n";
echo "Conectado a: $host:$port, DB: $db\n\n";

try {
    echo "1. Listando Tabelas:\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
    
    echo "\n2. Estrutura da Tabela 'ocorrencias':\n";
    if (in_array('ocorrencias', $tables)) {
        $columns = $pdo->query("DESCRIBE ocorrencias")->fetchAll();
        foreach ($columns as $col) {
            echo "   Field: {$col['Field']} | Type: {$col['Type']} | Null: {$col['Null']}\n";
        }
    } else {
        echo "   ERRO: Tabela 'ocorrencias' não encontrada!\n";
    }

    echo "\n3. Estrutura da Tabela 'notificacoes':\n";
    if (in_array('notificacoes', $tables)) {
        $columns = $pdo->query("DESCRIBE notificacoes")->fetchAll();
        foreach ($columns as $col) {
            echo "   Field: {$col['Field']} | Type: {$col['Type']}\n";
        }
    } else {
        echo "   AVISO: Tabela 'notificacoes' não encontrada.\n";
    }

} catch (Exception $e) {
    echo "\nERRO CRÍTICO NO DIAGNÓSTICO:\n";
    echo $e->getMessage();
}
?>
