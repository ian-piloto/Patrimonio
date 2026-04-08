<?php
require_once 'db.php';

echo "<h1>Lançando Patch de Banco de Dados...</h1>";

try {
    // 1. Corrigir tabela ocorrencias (adicionar coluna tipo)
    echo "Verificando coluna 'tipo' na tabela 'ocorrencias'...<br>";
    $check = $pdo->query("SHOW COLUMNS FROM ocorrencias LIKE 'tipo'")->fetch();
    
    if (!$check) {
        $pdo->exec("ALTER TABLE ocorrencias ADD COLUMN tipo VARCHAR(50) NOT NULL AFTER sala_encontrada_id");
        echo "<span style='color:green'>+ Coluna 'tipo' adicionada com sucesso!</span><br>";
    } else {
        echo "Coluna 'tipo' já existe.<br>";
    }

    // 2. Criar tabela notificacoes
    echo "Verificando tabela 'notificacoes'...<br>";
    $pdo->exec("CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_destino_id INT NOT NULL,
        titulo VARCHAR(100) NOT NULL,
        mensagem TEXT NOT NULL,
        lida BOOLEAN DEFAULT FALSE,
        criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )");
    echo "<span style='color:green'>+ Tabela 'notificacoes' verificada/criada!</span><br>";

    echo "<h2>Banco de Dados atualizado com sucesso!</h2>";
    echo "<p>Agora você pode voltar ao sistema e tentar registrar a ocorrência novamente.</p>";
    echo "<a href='../index.html'>Voltar para o Sistema</a>";

} catch (Exception $e) {
    echo "<h2 style='color:red'>Erro ao atualizar:</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
