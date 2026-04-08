<?php
/**
 * import_excel_data.php
 * Script para importar dados do JSON extraído do Excel para o banco de dados.
 */

require_once 'api/db.php';

echo "--- INICIANDO IMPORTAÇÃO DOS DADOS DO EXCEL ---\n";

// 1. Atualizar Schema (Adicionar colunas se não existirem)
echo "Atualizando schema das tabelas...\n";

// Tabelas extras para Salas
$cols_salas = [
    'codigo_localizacao' => 'VARCHAR(50)',
    'codigo_unidade' => 'VARCHAR(20)',
    'identificador_aux' => 'VARCHAR(20)',
    'bloco' => 'VARCHAR(20)',
    'sigla_sala' => 'VARCHAR(50)'
];
foreach ($cols_salas as $col => $type) {
    $check = $pdo->query("SHOW COLUMNS FROM salas LIKE '$col'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE salas ADD COLUMN $col $type");
    }
}

// Coluna Status para Patrimônios
$checkStatus = $pdo->query("SHOW COLUMNS FROM patrimonios LIKE 'status'")->fetch();
if (!$checkStatus) {
    $pdo->exec("ALTER TABLE patrimonios ADD COLUMN status VARCHAR(100) DEFAULT 'Em uso'");
}

try {
    $pdo->beginTransaction();

    // 2. Garantir Administrador Master
    echo "Verificando Administrador Master...\n";
    $stmtAdmin = $pdo->prepare("SELECT id FROM usuarios WHERE email = 'admin@senai.br'");
    $stmtAdmin->execute();
    if (!$stmtAdmin->fetch()) {
        $stmtCreateAdmin = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmtCreateAdmin->execute(['Administrador Master', 'admin@senai.br', 'senai123', 'admin']);
        echo "Administrador Master criado (admin@senai.br / senai123)\n";
    }

    // 3. Carregar JSON
    $jsonPath = __DIR__ . '/excel_full.json';
    if (!file_exists($jsonPath)) {
        die("ERRO: Arquivo excel_full.json não encontrado!\n");
    }
    $data = json_decode(file_get_contents($jsonPath), true);
    if (!$data) {
        die("ERRO: Falha ao ler JSON!\n");
    }

    // 4. Categorias (Garantir a categoria 9 - Outros)
    $pdo->exec("INSERT IGNORE INTO categorias_patrimonio (id, nome) VALUES (9, 'Outros')");

    $professoresCache = [];
    $salasCache = [];
    $inseridosCount = 0;
    $errosCount = 0;

    echo "Processando " . count($data) . " linhas...\n";

    foreach ($data as $index => $row) {
        if ($index === 0) continue; // Pula cabeçalho

        // Mapeamento baseado na análise da sheet3:
        // B: Id Localização
        // C: Cod. Unid.
        // D: Id. Aux.
        // E: Bloco
        // F: Sigla Sala
        // G: Descr. Sala
        // I: Nº Invent. (QR Code)
        // J: Data
        // K: Nome do Patrimônio
        // L: Responsável
        // M: Status

        $idLocalizacao = trim($row['B'] ?? '');
        $codUnid = trim($row['C'] ?? '');
        $idAux = trim($row['D'] ?? '');
        $bloco = trim($row['E'] ?? '');
        $siglaSala = trim($row['F'] ?? '');
        $descrSala = trim($row['G'] ?? '');
        $qrCode = trim($row['I'] ?? '');
        $dataInc = trim($row['J'] ?? '');
        $nomePat = trim($row['K'] ?? '');
        $responsavelNome = trim($row['L'] ?? '');
        $status = trim($row['M'] ?? '');

        if (empty($qrCode) || empty($nomePat)) continue;

        // 4.1 Processar Professor
        if (!empty($responsavelNome)) {
            if (!isset($professoresCache[$responsavelNome])) {
                $stmtP = $pdo->prepare("SELECT id FROM professores WHERE nome = ?");
                $stmtP->execute([$responsavelNome]);
                $pId = $stmtP->fetchColumn();

                if (!$pId) {
                    // Criar Usuário professor
                    $emailProf = strtolower(preg_replace('/[^a-zA-Z]/', '', explode(' ', $responsavelNome)[0])) . '.' . rand(100, 999) . '@senai.br';
                    $stmtU = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, 'professor')");
                    $stmtU->execute([$responsavelNome, $emailProf, 'senai123']);
                    $uId = $pdo->lastInsertId();

                    $stmtNP = $pdo->prepare("INSERT INTO professores (nome, usuario_id) VALUES (?, ?)");
                    $stmtNP->execute([$responsavelNome, $uId]);
                    $pId = $pdo->lastInsertId();
                }
                $professoresCache[$responsavelNome] = $pId;
            }
            $profId = $professoresCache[$responsavelNome];
        } else {
            $profId = null;
        }

        // 4.2 Processar Sala
        $chaveSala = $idLocalizacao ?: ($descrSala ?: 'N/A');
        if (!isset($salasCache[$chaveSala])) {
            $stmtS = $pdo->prepare("SELECT id FROM salas WHERE codigo_localizacao = ? OR nome_sala = ?");
            if ($idLocalizacao) {
                $stmtS->execute([$idLocalizacao, $descrSala]);
            } else {
                $stmtS->execute(['NONE', $descrSala]);
            }
            $sId = $stmtS->fetchColumn();

            if (!$sId) {
                $nomeFinal = $descrSala ?: "Sala " . ($idLocalizacao ?: "N/A");
                $stmtNS = $pdo->prepare("INSERT INTO salas (nome_sala, professor_id, codigo_localizacao, codigo_unidade, identificador_aux, bloco, sigla_sala) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmtNS->execute([$nomeFinal, $profId, $idLocalizacao, $codUnid, $idAux, $bloco, $siglaSala]);
                $sId = $pdo->lastInsertId();
            } else {
                // Atualiza o professor se a sala já existir (regra de um por ambiente)
                if ($profId) {
                    $pdo->prepare("UPDATE salas SET professor_id = ? WHERE id = ?")->execute([$profId, $sId]);
                }
            }
            $salasCache[$chaveSala] = $sId;
        }
        $salaId = $salasCache[$chaveSala];

        // 4.3 Inserir Patrimônio
        try {
            $stmtV = $pdo->prepare("SELECT id FROM patrimonios WHERE numero_qrcode = ?");
            $stmtV->execute([$qrCode]);
            if (!$stmtV->fetch()) {
                // Tenta inferir categoria
                $catId = 9; // Outros por padrão
                $n = mb_strtoupper($nomePat, 'UTF-8');
                if (strpos($n, 'CADEIRA') !== false) $catId = 3;
                elseif (strpos($n, 'COMPUTADOR') !== false || strpos($n, 'DESKTOP') !== false) $catId = 1;
                elseif (strpos($n, 'MONITOR') !== false) $catId = 2;
                elseif (strpos($n, 'MESA') !== false) $catId = 4;
                elseif (strpos($n, 'PROJETOR') !== false) $catId = 5;
                elseif (strpos($n, 'AR CONDICIONADO') !== false || strpos($n, 'SPLIT') !== false) $catId = 6;
                elseif (strpos($n, 'NOTEBOOK') !== false) $catId = 7;
                elseif (strpos($n, 'TECLADO') !== false || strpos($n, 'MOUSE') !== false) $catId = 8;

                $stmtI = $pdo->prepare("INSERT INTO patrimonios (numero_qrcode, nome_descricao, categoria_id, sala_atual_id, status) VALUES (?, ?, ?, ?, ?)");
                $stmtI->execute([$qrCode, $nomePat, $catId, $salaId, $status]);
                $inseridosCount++;
            }
        } catch (Exception $e) {
            $errosCount++;
        }
    }

    $pdo->commit();
    echo "\nIMPORTAÇÃO CONCLUÍDA COM SUCESSO!\n";
    echo "- Itens novos inseridos: $inseridosCount\n";
    echo "- Professores cadastrados/verificados: " . count($professoresCache) . "\n";
    echo "- Salas cadastradas/verificadas: " . count($salasCache) . "\n";
    echo "- Erros ignorados: $errosCount\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    die("ERRO FATAL: " . $e->getMessage() . "\n");
}
