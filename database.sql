    -- Sistema de Gestão de Patrimônios SENAI
    -- Script de Inicialização do Banco de Dados

    CREATE DATABASE IF NOT EXISTS patrimonio_senai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE patrimonio_senai;

    -- Tabela de Usuários (Acesso ao Sistema)
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        tipo ENUM('admin', 'professor') DEFAULT 'professor',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de Professores 
    CREATE TABLE IF NOT EXISTS professores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        usuario_id INT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    -- Tabela de Salas
    CREATE TABLE IF NOT EXISTS salas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome_sala VARCHAR(50) NOT NULL,
        professor_id INT,
        FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
    );

    -- Tabela de Categorias do Patrimônio
    CREATE TABLE IF NOT EXISTS categorias_patrimonio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE
    );

    -- Tabela de Patrimônios
    CREATE TABLE IF NOT EXISTS patrimonios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_qrcode VARCHAR(100) NOT NULL UNIQUE,
        nome_descricao VARCHAR(200) NOT NULL,
        categoria_id INT,
        sala_atual_id INT,
        adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias_patrimonio(id) ON DELETE RESTRICT,
        FOREIGN KEY (sala_atual_id) REFERENCES salas(id) ON DELETE RESTRICT
    );

    -- Tabela de Ocorrências
    CREATE TABLE IF NOT EXISTS ocorrencias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patrimonio_id INT NOT NULL,
        sala_encontrada_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descricao_problema TEXT,
        data_ocorrencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('aberta', 'resolvida') DEFAULT 'aberta',
        FOREIGN KEY (patrimonio_id) REFERENCES patrimonios(id) ON DELETE CASCADE,
        FOREIGN KEY (sala_encontrada_id) REFERENCES salas(id) ON DELETE RESTRICT
    );

    -- Tabela de Empréstimos (Trânsito de Materiais)
    CREATE TABLE IF NOT EXISTS emprestimos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patrimonio_id INT NOT NULL,
        sala_origem_id INT NOT NULL,
        sala_destino_id INT NOT NULL,
        data_emprestimo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        devolvido BOOLEAN DEFAULT FALSE,
        data_devolucao TIMESTAMP NULL,
        FOREIGN KEY (patrimonio_id) REFERENCES patrimonios(id) ON DELETE CASCADE,
        FOREIGN KEY (sala_origem_id) REFERENCES salas(id) ON DELETE RESTRICT,
        FOREIGN KEY (sala_destino_id) REFERENCES salas(id) ON DELETE RESTRICT
    );

    -- Tabela de Notificações
    CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_destino_id INT NOT NULL,
        titulo VARCHAR(100) NOT NULL,
        mensagem TEXT NOT NULL,
        dados_json TEXT,
        lida BOOLEAN DEFAULT FALSE,
        criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- INSERÇÕES INICIAIS (Acesso inicial)
    -- Senha padrão: 'senai123'
    INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
    ('Administrador SENAI', 'admin@senai.br', 'senai123', 'admin')
    ON DUPLICATE KEY UPDATE id=id;
