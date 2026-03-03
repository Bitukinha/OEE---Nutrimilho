-- Execute isso diretamente no Supabase SQL Editor

-- Dropar tudo antigo (se existir)
DROP TABLE IF EXISTS public.operacoes_extras CASCADE;
DROP FUNCTION IF EXISTS public.get_operacoes_extras();
DROP FUNCTION IF EXISTS public.insert_operacao_extra(TEXT,TEXT,DATE,DATE,TEXT);
DROP FUNCTION IF EXISTS public.update_operacoes_extras_updated_at();

-- Criar tabela nova
CREATE TABLE public.operacoes_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX idx_operacoes_extras_status ON public.operacoes_extras(status);
CREATE INDEX idx_operacoes_extras_data_prevista ON public.operacoes_extras(data_prevista_termino);

-- Habilitar RLS
ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

-- Criar policy
CREATE POLICY "Allow all operations" ON public.operacoes_extras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_operacoes_extras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_operacoes_extras_updated_at
  BEFORE UPDATE ON public.operacoes_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_operacoes_extras_updated_at();
