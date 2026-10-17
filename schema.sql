-- ============================================================================
-- SaaS Plioou - Modelagem Relacional e Fundação de Persistência (PostgreSQL 16)
-- Script Estruturado DDL com ENUMs, Tabelas, Índices B-Tree e Seeds
-- ============================================================================

-- 1. TIPOS ENUMERADOS (ENUMs)
DO $$ 
BEGIN
    -- Tipo ENUM de Perfis de Usuário
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_role') THEN
        CREATE TYPE usuario_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TECNICO');
    END IF;

    -- Tipo ENUM de Status da Ordem de Serviço
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_status') THEN
        CREATE TYPE os_status AS ENUM (
            'ABERTO', 
            'EM_ANDAMENTO', 
            'AGUARDANDO_TERCEIRO', 
            'RESOLVIDO', 
            'CANCELADO'
        );
    END IF;
END $$;

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role usuario_role NOT NULL DEFAULT 'TECNICO',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. TABELA DE CLIENTES (clients)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj_or_cpf VARCHAR(30),
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. TABELA DE ORDENS DE SERVIÇO
CREATE TABLE IF NOT EXISTS ordens_servico (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    status os_status NOT NULL DEFAULT 'ABERTO',
    solicitante_nome VARCHAR(255) NOT NULL,
    solicitante_setor VARCHAR(100) NOT NULL,
    tecnico_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. ÍNDICES B-TREE DE ALTA PERFORMANCE
-- Otimização de consultas críticas do dashboard técnico (filtragem por status e técnico responsável)
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico USING btree (status);
CREATE INDEX IF NOT EXISTS idx_os_tecnico ON ordens_servico USING btree (tecnico_id);
CREATE INDEX IF NOT EXISTS idx_clients_cnpj_cpf ON clients USING btree (cnpj_or_cpf);

-- 6. TRIGGERS AUTOMÁTICOS DE ATUALIZAÇÃO (updated_at / atualizado_em)
CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_current_timestamp_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_atualizado_em();

DROP TRIGGER IF EXISTS trg_ordens_servico_updated_at ON ordens_servico;
CREATE TRIGGER trg_ordens_servico_updated_at
BEFORE UPDATE ON ordens_servico
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_updated_at();

-- 7. MASSA DE TESTES LIMPA (SEEDS INICIAIS)
-- Senha de teste padrão criptografada em bcrypt ($2a$10$...):
-- Admin (SUPER_ADMIN): admin@plioou.com (senha: admin123)
-- Técnico: tecnico@plioou.com (senha: tech123)
INSERT INTO usuarios (nome, email, senha_hash, role)
VALUES 
    (
        'Administrador Plioou', 
        'admin@plioou.com', 
        '$2a$10$wT5nN58tM0v5zCeql34g8ObzH4W5n.695Z36K6aF5Q2tJ0M1LgLcy', 
        'SUPER_ADMIN'
    ),
    (
        'Técnico Especialista', 
        'tecnico@plioou.com', 
        '$2a$10$9GvS15.vj751o3Qv3c7q7.57a3eZ2K7K9j9f8E4Y3H2R1G0F9E8Dc', 
        'TECNICO'
    )
ON CONFLICT (email) DO UPDATE 
SET 
    nome = EXCLUDED.nome,
    senha_hash = EXCLUDED.senha_hash,
    role = EXCLUDED.role;
