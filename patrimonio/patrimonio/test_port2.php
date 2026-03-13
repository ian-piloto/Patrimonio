<?php
$out = fopen('test_output.txt', 'w');
function testConn($port, $user, $pass)
{
    global $out;
    fwrite($out, "Testando porta $port com usuario '$user' e senha '$pass'...\n");
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=$port", $user, $pass);
        fwrite($out, "SUCESSO!\n");
        return true;
    }
    catch (Exception $e) {
        fwrite($out, "FALHA: " . $e->getMessage() . "\n");
    }
    return false;
}

testConn(3306, 'root', '');
testConn(3306, 'root', 'root');
testConn(3308, 'root', '');
fclose($out);
?>
