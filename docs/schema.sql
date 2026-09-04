-- ====================================================================
-- PROJETO INTERDISCIPLINAR (PI) – 6º SEMESTRE
-- MODELO DE BANCO DE DADOS LÓGICO / DDL
-- Sistema de Agendamento de Serviços Multiplataforma
-- Compatível com: PostgreSQL 14+ e SQLite3
-- ====================================================================

-- 1. Tabela: USUARIO
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- Armazenada com hash seguro bcrypt (RNF03)
    telefone VARCHAR(20) NOT NULL,
    tipo_perfil VARCHAR(20) NOT NULL CHECK (tipo_perfil IN ('Cliente', 'Prestador', 'Admin')),
    foto_perfil VARCHAR(255),
    nome_negocio VARCHAR(120),    -- Específico para prestadores (RF02)
    endereco VARCHAR(200),        -- Específico para prestadores (RF02)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela: SERVICO
CREATE TABLE IF NOT EXISTS servicos (
    id_servico SERIAL PRIMARY KEY,
    id_prestador INT NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT,
    duracao_minutos INT NOT NULL CHECK (duracao_minutos > 0),
    preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_servico_prestador FOREIGN KEY (id_prestador) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 3. Tabela: JORNADA_TRABALHO (Schedule)
CREATE TABLE IF NOT EXISTS jornadas_trabalho (
    id_jornada SERIAL PRIMARY KEY,
    id_prestador INT NOT NULL,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    inicio_intervalo TIME,
    fim_intervalo TIME,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_jornada_prestador FOREIGN KEY (id_prestador) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_horario_jornada CHECK (hora_fim > hora_inicio),
    CONSTRAINT chk_horario_intervalo CHECK (
        (inicio_intervalo IS NULL AND fim_intervalo IS NULL) OR
        (inicio_intervalo >= hora_inicio AND fim_intervalo <= hora_fim AND fim_intervalo > inicio_intervalo)
    ),
    CONSTRAINT uk_prestador_dia UNIQUE (id_prestador, dia_semana)
);

-- 4. Tabela: AGENDAMENTO
CREATE TABLE IF NOT EXISTS agendamentos (
    id_agendamento SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_prestador INT NOT NULL,
    id_servico INT NOT NULL,
    data_hora_inicio TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente' 
        CHECK (status IN ('Pendente', 'Confirmado', 'Cancelado', 'Concluído')),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendamento_cliente FOREIGN KEY (id_cliente) 
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_agendamento_prestador FOREIGN KEY (id_prestador) 
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_agendamento_servico FOREIGN KEY (id_servico) 
        REFERENCES servicos(id_servico) ON DELETE RESTRICT,
    CONSTRAINT chk_datas_agendamento CHECK (data_hora_fim > data_hora_inicio)
);

-- 5. Tabela: AVALIACAO (1:1 Opcional com Agendamento Concluído)
CREATE TABLE IF NOT EXISTS avaliacoes (
    id_avaliacao SERIAL PRIMARY KEY,
    id_agendamento INT NOT NULL UNIQUE, -- Relação 1:1 estrita
    nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    sentimento_predito VARCHAR(15) CHECK (sentimento_predito IN ('Positivo', 'Negativo')),
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_avaliacao_agendamento FOREIGN KEY (id_agendamento) 
        REFERENCES agendamentos(id_agendamento) ON DELETE CASCADE
);

-- ====================================================================
-- ÍNDICES E OTIMIZAÇÕES DE DESEMPENHO (RNF01 & RNF07)
-- ====================================================================

-- Índice para busca ágil de sobreposição e conflito de horários (Anti-Double Booking)
CREATE INDEX IF NOT EXISTS idx_agendamentos_prestador_datas 
ON agendamentos (id_prestador, data_hora_inicio, data_hora_fim, status);

-- Índice para consulta de histórico do cliente
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente 
ON agendamentos (id_cliente, data_hora_inicio);

-- Índice para consulta de jornada do prestador por dia da semana
CREATE INDEX IF NOT EXISTS idx_jornada_prestador_dia 
ON jornadas_trabalho (id_prestador, dia_semana);

-- Índice para catálogo de serviços ativos
CREATE INDEX IF NOT EXISTS idx_servicos_prestador_ativo 
ON servicos (id_prestador, ativo);
