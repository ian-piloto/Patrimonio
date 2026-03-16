<?php
// Desativa exibição de erros no output para não quebrar o JSON
ini_set('display_errors', 0);
error_reporting(0);

session_start();
header('Content-Type: application/json');
require_once 'db.php';

// Endpoint para lidar com requisições de Autenticação
$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    if (empty($email) || empty($senha)) {
        echo json_encode(["status" => "error", "message" => "E-mail e senha são obrigatórios."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, nome, senha, tipo FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        if ($usuario && password_verify($senha, $usuario['senha'])) {
            // Sucesso no login
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            $_SESSION['usuario_tipo'] = $usuario['tipo'];

            echo json_encode([
                "status" => "success",
                "message" => "Login realizado com sucesso",
                "tipo" => $usuario['tipo']
            ]);
        }
        else {
            echo json_encode(["status" => "error", "message" => "E-mail ou senha incorretos."]);
        }
    }
    catch (\PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro de BD: " . $e->getMessage()]);
    }
}

elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success", "message" => "Deslogado com sucesso."]);
}

elseif ($action === 'check_session') {
    if (isset($_SESSION['usuario_id'])) {
        echo json_encode([
            "status" => "logged_in",
            "nome" => $_SESSION['usuario_nome'],
            "tipo" => $_SESSION['usuario_tipo']
        ]);
    }
    else {
        echo json_encode(["status" => "logged_out"]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "Ação de autenticação inválida."]);
}
?>
