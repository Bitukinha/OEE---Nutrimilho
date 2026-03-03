-- Adicionar coluna concluido na tabela operacoes_extras
ALTER TABLE operacoes_extras ADD COLUMN IF NOT EXISTS concluido boolean DEFAULT false;
ALTER TABLE operacoes_extras ADD COLUMN IF NOT EXISTS data_conclusao date;

-- Query para testar:
-- SELECT * FROM operacoes_extras;
