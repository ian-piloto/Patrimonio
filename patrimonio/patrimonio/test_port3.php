<?php
function testConn($host, $port, $user, $pass)
{
    echo "Testando $host:$port com usuario '$user' e senha '$pass'...\n";
    try {
        $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass);
        echo "SUCESSO!\n";
        return true;
    }
    catch (Exception $e) {
        echo "FALHA: " . $e->getMessage() . "\n";
    }
    return false;
}

testConn('localhost', 3306, 'root', '');
testConn('127.0.0.1', 3306, 'root', '');
?>
