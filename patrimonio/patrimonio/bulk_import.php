<?php
/**
 * bulk_import.php
 * Script automatizado para carregar centenas de itens do Excel no Banco de Dados
 */

$host = 'localhost';
$dbname = 'patrimonio_senai';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- INICIANDO IMPORTAÇÃO EM MASSA ---\n";

    // 1. Limpeza de dados de teste (Opcional, mas recomendado para o ambiente do usuário)
    echo "Limpando tabelas de movimentos e patrimônios...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE emprestimos");
    $pdo->exec("TRUNCATE TABLE ocorrencias");
    $pdo->exec("TRUNCATE TABLE patrimonios");
    $pdo->exec("TRUNCATE TABLE salas");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // 2. Garantir Categorias Básicas
    $categoriasPredefinidas = [
        1 => 'Computadores',
        2 => 'Monitores',
        3 => 'Cadeiras',
        4 => 'Mesas',
        5 => 'Projetores',
        6 => 'Ar Condicionado',
        7 => 'Notebooks',
        8 => 'Teclados/Mouses',
        9 => 'Outros'
    ];
    
    foreach ($categoriasPredefinidas as $id => $nome) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO categorias_patrimonio (id, nome) VALUES (?, ?)");
        $stmt->execute([$id, $nome]);
    }

    // 3. Carregar CSV (Mais completo que o JSON)
    $csvPath = __DIR__ . '/PATRIMONIO_FORMATADO.csv';
    if (!file_exists($csvPath)) {
        die("ERRO: Arquivo PATRIMONIO_FORMATADO.csv não encontrado!\n");
    }
    
    $handle = fopen($csvPath, 'r');
    if (!$handle) {
        die("ERRO: Falha ao abrir CSV!\n");
    }

    $inseridos = 0;
    $salasCriadas = [];
    $linha = 0;

    // 4. Lógica de Mapeamento de Categoria
    function identificarCategoria($nome) {
        $n = mb_strtoupper($nome, 'UTF-8');
        if (strpos($n, 'CADEIRA') !== false || strpos($n, 'BANQUETA') !== false) return 3;
        if (strpos($n, 'COMPUTADOR') !== false || strpos($n, 'DESKTOP') !== false || strpos($n, 'CPU') !== false) return 1;
        if (strpos($n, 'MONITOR') !== false || strpos($n, 'TELA') !== false) return 2;
        if (strpos($n, 'MESA') !== false || strpos($n, 'BANCADA') !== false || strpos($n, 'ARMARIO') !== false) return 4;
        if (strpos($n, 'PROJETOR') !== false || strpos($n, 'DATA SHOW') !== false) return 5;
        if (strpos($n, 'AR CONDICIONADO') !== false || strpos($n, 'SPLIT') !== false) return 6;
        if (strpos($n, 'NOTEBOOK') !== false || strpos($n, 'LAPTOP') !== false) return 7;
        if (strpos($n, 'TECLADO') !== false || strpos($n, 'MOUSE') !== false) return 8;
        return 9; // Outros
    }

    // 5. Processamento dos Dados
    while (($row = fgetcsv($handle, 1000, ";")) !== FALSE) {
        $linha++;
        if ($linha <= 4) continue; // Pula cabeçalhos

        // Corrige codificação (Excel geralmente usa Windows-1252)
        foreach ($row as $k => $v) {
            $row[$k] = mb_convert_encoding($v, "UTF-8", "Windows-1252");
        }
        
        // Estrutura esperada: Col 1 = Sala/Local, Col 7 = QR Code, Col 10 = Descrição
        $salaNomeRaw = trim($row[1] ?? '');
        $qrCode = trim($row[7] ?? '');
        $descricao = trim($row[10] ?? '');

        if (empty($qrCode) || empty($descricao)) continue;

        // Gerenciar Sala dinamicamente
        $nomeSalaFinal = "Setor " . ($salaNomeRaw ?: "N/A");
        if (!isset($salasCriadas[$nomeSalaFinal])) {
            $stmtSala = $pdo->prepare("SELECT id FROM salas WHERE nome_sala = ?");
            $stmtSala->execute([$nomeSalaFinal]);
            $sId = $stmtSala->fetchColumn();

            if (!$sId) {
                $stmtNewSala = $pdo->prepare("INSERT INTO salas (nome_sala) VALUES (?)");
                $stmtNewSala->execute([$nomeSalaFinal]);
                $sId = $pdo->lastInsertId();
            }
            $salasCriadas[$nomeSalaFinal] = $sId;
        }
        $salaId = $salasCriadas[$nomeSalaFinal];

        // Identificar Categoria
        $catId = identificarCategoria($descricao);

        // Inserir Patrimônio
        try {
            $stmtPat = $pdo->prepare("INSERT IGNORE INTO patrimonios (numero_qrcode, nome_descricao, categoria_id, sala_atual_id) VALUES (?, ?, ?, ?)");
            $stmtPat->execute([$qrCode, $descricao, $catId, $salaId]);
            if ($stmtPat->rowCount() > 0) $inseridos++;
        } catch (Exception $e) {
            // Ignora erros individuais de duplicidade
        }
    }
    fclose($handle);

    echo "IMPORTAÇÃO CONCLUÍDA!\n";
    echo "Total de itens inseridos: $inseridos\n";
    echo "Total de setores criados: " . count($salasCriadas) . "\n";

} catch (PDOException $e) {
    die("ERRO NO BANCO: " . $e->getMessage() . "\n");
}
