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

-- INSERÇÕES DE TESTE INICIAIS (SEED)

-- Senha padrão para testes: 'senai123' (hash gerado pelo password_hash do PHP)
INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
('Administrador SENAI', 'admin@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUEN', 'admin'),
('Professor João', 'joao@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUEN', 'professor'),
('Professora Maria', 'maria@senai.br', '$2y$10$0aivcj2VKkwTVO.WzNGEwyDy1AxMAqgeZ6wPrhEUEN', 'professor')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO professores (id, nome, usuario_id) VALUES 
(1, 'Professor João', 2),
(2, 'Professora Maria', 3)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO salas (id, nome_sala, professor_id) VALUES 
(1, 'Laboratório de Informática 1', 1),
(2, 'Laboratório de Informática 2', 2),
(3, 'Sala de Impressão 3D', 1),
(4, 'Sala Teórica 10', NULL)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO categorias_patrimonio (id, nome) VALUES 
(1, 'Computadores'),
(2, 'Monitores'),
(3, 'Cadeiras'),
(4, 'Mesas'),
(5, 'Projetores')
ON DUPLICATE KEY UPDATE id=id;

-- Alguns itens para testes (QR Codes simulados: P001, P002, etc)
INSERT INTO patrimonios (numero_qrcode, nome_descricao, categoria_id, sala_atual_id) VALUES 
('P001', 'Computador Dell Optiplex Core i7', 1, 1),
('P002', 'Computador Dell Optiplex Core i7', 1, 1),
('M001', 'Monitor Dell 24"', 2, 1),
('C001', 'Cadeira Giratória Preta', 3, 2),
('PRJ01', 'Projetor Epson', 5, 2)
ON DUPLICATE KEY UPDATE id=id;
