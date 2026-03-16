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

    -- INSERÇÕES DE TESTE INICIAIS (SEED)

    -- Senha padrão para testes: 'senai123' (hash gerado pelo password_hash do PHP)
    INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
    ('Administrador SENAI', 'admin@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUENlU7iwE4m', 'admin'),
    ('Professor João', 'joao@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUENlU7iwE4m', 'professor'),
    ('Professora Maria', 'maria@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUENlU7iwE4m', 'professor'),
    ('Professora Ana Clara', 'ana@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUENlU7iwE4m', 'professor'),
    ('Professor Carlos', 'carlos@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUENlU7iwE4m', 'professor')
    ON DUPLICATE KEY UPDATE id=id;

    INSERT INTO professores (nome, usuario_id) VALUES 
    ('Professor João', 2),
    ('Professora Maria', 3),
    ('Professora Ana Clara', 4),
    ('Professor Carlos', 5)
    ON DUPLICATE KEY UPDATE id=id;

    INSERT INTO salas (id, nome_sala, professor_id) VALUES 
    (1, 'Laboratório de Informática 1', 1),
    (2, 'Laboratório de Informática 2', 2),
    (3, 'Sala de Impressão 3D', 1),
    (4, 'Sala Teórica 10', NULL),
    (5, 'Almoxarifado Central', NULL),
    (6, 'Laboratório de Redes', 4),
    (7, 'Sala dos Professores', NULL)
    ON DUPLICATE KEY UPDATE id=id;

    INSERT INTO categorias_patrimonio (id, nome) VALUES 
    (1, 'Computadores'),
    (2, 'Monitores'),
    (3, 'Cadeiras'),
    (4, 'Mesas'),
    (5, 'Projetores'),
    (6, 'Ar Condicionado'),
    (7, 'Notebooks'),
    (8, 'Teclados/Mouses')
    ON DUPLICATE KEY UPDATE id=id;

    -- Alguns itens para testes (QR Codes simulados: P001, P002, etc)
    INSERT INTO patrimonios (numero_qrcode, nome_descricao, categoria_id, sala_atual_id) VALUES 
    ('P001', 'Computador Dell Optiplex Core i7', 1, 1),
    ('P002', 'Computador Dell Optiplex Core i7', 1, 1),
    ('P003', 'Notebook Dell Latitude', 7, 4),
    ('P004', 'Notebook Dell Latitude', 7, 4),
    ('M001', 'Monitor Dell 24"', 2, 1),
    ('M002', 'Monitor Samsung 27"', 2, 2),
    ('C001', 'Cadeira Giratória Preta', 3, 2),
    ('C002', 'Cadeira Fixa Azul', 3, 3),
    ('PRJ01', 'Projetor Epson PowerLite', 5, 2),
    ('AC01', 'Ar Condicionado LG 12000 BTUs', 6, 1),
    ('K001', 'Teclado Mecânico Logitech', 8, 5)
    ON DUPLICATE KEY UPDATE id=id;

    -- Inserindo Ocorrências de Exemplo
    INSERT INTO ocorrencias (patrimonio_id, sala_encontrada_id, tipo, descricao_problema, status) VALUES
    (5, 1, 'Equipamento Quebrado', 'Monitor apresentando listras horizontais', 'aberta'),
    (7, 2, 'Outro', 'Pé da cadeira está bambo', 'aberta')
    ON DUPLICATE KEY UPDATE id=id;

    -- Inserindo Empréstimos de Exemplo
    INSERT INTO emprestimos (patrimonio_id, sala_origem_id, sala_destino_id) VALUES
    (3, 4, 1),
    (11, 5, 2)
    ON DUPLICATE KEY UPDATE id=id;
