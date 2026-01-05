-- Criar tabela de motivos de paradas
CREATE TABLE IF NOT EXISTS motivos_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('nao_planejada', 'planejada', 'manutencao', 'setup')),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de motivos de bloqueios
CREATE TABLE IF NOT EXISTS motivos_bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir motivos padrão de paradas
INSERT INTO motivos_paradas (nome, categoria, descricao) VALUES
  ('Manutenção preventiva', 'manutencao', 'Manutenção planejada da máquina'),
  ('Manutenção corretiva', 'manutencao', 'Conserto de falhas inesperadas'),
  ('Troca de molde', 'setup', 'Troca de molde ou ferramental'),
  ('Limpeza e ajuste', 'setup', 'Limpeza e ajuste de equipamento'),
  ('Falta de matéria-prima', 'nao_planejada', 'Parada por falta de insumos'),
  ('Falta de operador', 'nao_planejada', 'Parada por indisponibilidade de pessoal'),
  ('Problema elétrico', 'manutencao', 'Falha no sistema elétrico'),
  ('Problema mecânico', 'manutencao', 'Falha no sistema mecânico'),
  ('Bloqueio de qualidade', 'nao_planejada', 'Parada para corrigir problemas de qualidade')
ON CONFLICT (nome) DO NOTHING;

-- Inserir motivos padrão de bloqueios
INSERT INTO motivos_bloqueios (nome, descricao) VALUES
  ('Desvio de especificação', 'Produto não atende às especificações'),
  ('Contaminação', 'Produto contaminado ou com impurezas'),
  ('Dano no embalagem', 'Dano visual ou estrutural na embalagem'),
  ('Falta de documentação', 'Falta de rastreabilidade ou documentação'),
  ('Produto fora do prazo', 'Produto com validade vencida'),
  ('Suspeita de desconformidade', 'Suspeita de não conformidade não confirmada'),
  ('Erro de processamento', 'Erro durante o processamento do produto'),
  ('Problema visual', 'Defeito visual detectado')
ON CONFLICT (nome) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_motivos_paradas_ativo ON motivos_paradas(ativo);
CREATE INDEX IF NOT EXISTS idx_motivos_bloqueios_ativo ON motivos_bloqueios(ativo);

-- Enable RLS
ALTER TABLE motivos_paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_bloqueios ENABLE ROW LEVEL SECURITY;

-- Criar policies para leitura pública (opcional, depende da sua política de segurança)
CREATE POLICY "Allow public read on motivos_paradas" ON motivos_paradas
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on motivos_bloqueios" ON motivos_bloqueios
  FOR SELECT USING (true);
