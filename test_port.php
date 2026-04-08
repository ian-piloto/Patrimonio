<?php
function testPort($port)
{
    echo "Testando porta $port...\n";
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=$port", 'root', '');
        echo "SUCESSO: Conectado ao MySQL na porta $port sem senha.\n";
        return true;
    }
    catch (Exception $e) {
        echo "FALHA sem senha: " . $e->getMessage() . "\n";
    }

    // Testa com senha root se der falha
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=$port", 'root', 'root');
        echo "SUCESSO: Conectado ao MySQL na porta $port com senha 'root'.\n";
        return true;
    }
    catch (Exception $e) {
        echo "FALHA com senha 'root': " . $e->getMessage() . "\n";
    }

    return false;
}

testPort(3306);
testPort(3308);
?>
