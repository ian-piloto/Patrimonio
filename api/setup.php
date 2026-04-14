<?php
/**
 * Script de Configuração e Sincronização Automática
 * Este script cria o banco de dados caso não exista e importa a estrutura/dados do arquivo SQL.
 */

// Configurações locais (Devem bater com o ambiente XAMPP padrão)
$host = '127.0.0.1';
$user = 'root';
$pass = ''; // XAMPP padrão é sem senha. Se tiver senha no outro PC, ajustar aqui.
$dbName = 'patrimonio_senai';

try {
    // 1. Conexão inicial com o MySQL (sem especificar o banco)
    $dsn = "mysql:host=$host;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h1>Iniciando Sincronização...</h1>";

    // 2. Cria o banco de dados se ele não existir
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName` ");
    echo "<p>✔️ Banco de dados <strong>$dbName</strong> verificado/criado.</p>";

    // 3. Lê o arquivo SQL
    $sqlPath = __DIR__ . '/../database.sql';
    if (!file_exists($sqlPath)) {
        throw new Exception("Arquivo database.sql não encontrado em: $sqlPath");
    }

    $sql = file_get_contents($sqlPath);
    if ($sql === false) {
        throw new Exception("Não foi possível ler o conteúdo do arquivo database.sql");
    }

    // 4. Executa o SQL (Habilitando múltiplos statements para o dump completo)
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
    $pdo->exec($sql);
    
    echo "<h1>✅ Sincronização Concluída com Sucesso!</h1>";
    echo "<p>As tabelas e dados foram restaurados corretamente.</p>";
    echo "<br><a href='../index.html' style='padding:12px 25px; background:#28a745; color:white; text-decoration:none; border-radius:5px; font-weight:bold;'>Acessar o Sistema</a>";

} catch (Exception $e) {
    echo "<h1 style='color:red;'>❌ Erro na Sincronização</h1>";
    echo "<div style='background:#fee; border:1px solid red; padding:15px; border-radius:5px;'>";
    echo "<strong>Mensagem:</strong> " . $e->getMessage();
    echo "</div>";
    echo "<p><strong>Dica:</strong> Verifique se o MySQL no XAMPP está ligado e se o usuário/senha no início deste script estão corretos.</p>";
}
?>
