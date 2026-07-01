-- Criar tabela OPEX para gestão de atividades por departamento
CREATE TABLE IF NOT EXISTS opex (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente' | 'em_progresso' | 'pronto'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_opex_departamento ON opex(departamento);
CREATE INDEX idx_opex_status ON opex(status);
CREATE INDEX idx_opex_data_prevista ON opex(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE opex ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita completa (ajuste conforme necessário)
CREATE POLICY "Allow all operations on opex" ON opex
  FOR ALL
  USING (true)
  WITH CHECK (true);
