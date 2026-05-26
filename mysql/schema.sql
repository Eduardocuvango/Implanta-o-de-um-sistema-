-- =====================================================================
-- ESQUEMA DE BANCO DE DADOS MYSQL - HOSPITAL PEDIÁTRICO PIONEIRO ZECA
-- =====================================================================
-- Este arquivo contém a estrutura de tabelas caso decida migrar 
-- do Firebase para um servidor local físico on-premises (sem internet/nuvem).

CREATE DATABASE IF NOT EXISTS hospital_pioneiro_zeca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_pioneiro_zeca;

-- 1. TABELA DE COMPATIBILIDADE DE UTILIZADORES (AUTH & PERFIS)
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    staffId VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    signature VARCHAR(255) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABELA DE MÉDICOS PEDIATRAS
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    crm VARCHAR(50) NULL, -- Registo profissional local
    active BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. TABELA DE CONFIGURAÇÕES DE MONITORIZAÇÃO E ALERTAS DA HUÍLA
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    alertEmail VARCHAR(255) NOT NULL,
    alertPhone VARCHAR(50) NOT NULL,
    alertThreshold INT NOT NULL DEFAULT 5,
    backupFrequency ENUM('weekly', 'monthly', 'manual') NOT NULL DEFAULT 'manual',
    lastBackupDate VARCHAR(100) NULL,
    CHECK (id = 1) -- Garante registo único de parametrização
);

-- 4. TABELA AUXILIAR PARA ÁREAS MONITOREADAS (GEOGRAFIA DA HUÍLA)
CREATE TABLE IF NOT EXISTS monitored_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province VARCHAR(100) NOT NULL DEFAULT 'Huíla',
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA PRINCIPAL DE TRIAGEM / RECOLHA DE PACIENTES
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(128) PRIMARY KEY,
    patientSerialId VARCHAR(50) NOT NULL UNIQUE, -- Código sequencial ex: P-2026-0001
    name VARCHAR(255) NOT NULL,
    gender ENUM('Masculino', 'Feminino', 'Outro') NOT NULL,
    birthDate DATE NOT NULL,
    age INT NOT NULL,
    ageGroup VARCHAR(50) NOT NULL,
    occurrenceDate DATE NOT NULL,
    entryTime VARCHAR(100) NOT NULL, -- Horário de Entrada ISO ou Formato Amigável
    exitTime VARCHAR(100) NULL,
    serviceDuration INT NULL DEFAULT 0,
    status ENUM('Atendido', 'Em Espera') NOT NULL DEFAULT 'Em Espera',
    weight DECIMAL(5,2) NULL,
    temperature DECIMAL(4,1) NULL,
    bloodPressure VARCHAR(50) NULL,
    province VARCHAR(100) NOT NULL DEFAULT 'Huíla',
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NULL,
    occurrenceType VARCHAR(255) NOT NULL, -- Diagnóstico/Sintoma registado
    signalsSymptoms TEXT NOT NULL,         -- Anamnese clínica detalhada
    diagnosis VARCHAR(255) NULL,
    priority ENUM('Baixa', 'Média', 'Alta', 'Emergência') NOT NULL DEFAULT 'Média',
    state ENUM('Internado', 'Atendido', 'Transferido', 'Alta', 'Óbito') NOT NULL DEFAULT 'Internado',
    receptionistId VARCHAR(128) NOT NULL,
    receptionistSignature VARCHAR(255) NOT NULL,
    deathReason VARCHAR(255) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (receptionistId) REFERENCES users(uid) ON DELETE RESTRICT
);

-- =====================================================================
-- CRIAÇÃO DE ÍNDICES E SEGURANÇA PARA ALTA DISPONIBILIDADE
-- =====================================================================

-- Índices para acelerar pesquisas de pacientes por nome e registo sequencial
CREATE INDEX idx_patient_name ON patients(name);
CREATE INDEX idx_patient_serial ON patients(patientSerialId);

-- Índices de consulta de relatórios epidemiológicos e territoriais rápidos
CREATE INDEX idx_patient_priority ON patients(priority);
CREATE INDEX idx_patient_status ON patients(status);
CREATE INDEX idx_patient_city ON patients(city);
CREATE INDEX idx_patient_occurrence ON patients(occurrenceType);

-- Registos Iniciais de Teste para Configuração e Utilizador Padrão Admin
INSERT INTO users (uid, staffId, name, email, role, signature) VALUES 
('local_administrator_id', 'STAFF-001', 'Administrador Local', 'admin@hospital.local', 'admin', 'Assinatura Digital Local')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO settings (id, alertEmail, alertPhone, alertThreshold, backupFrequency) VALUES 
(1, 'alertas-pediatria@hospital.ao', '+244920000000', 5, 'manual')
ON DUPLICATE KEY UPDATE alertEmail=alertEmail;
