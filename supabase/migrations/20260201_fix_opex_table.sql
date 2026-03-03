-- Fix completo: Remover todas as policies e triggers antigos antes de recriar
DROP TRIGGER IF EXISTS update_opex_updated_at ON public.opex;
DROP TRIGGER IF EXISTS update_opex_updated_at ON opex;
DROP FUNCTION IF EXISTS public.update_opex_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

DROP POLICY IF EXISTS "Allow all operations on opex" ON public.opex;
DROP POLICY IF EXISTS "Allow all operations on opex for anon" ON public.opex;
DROP POLICY IF EXISTS "Allow public read access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public insert access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public update access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public delete access to opex" ON public.opex;
DROP POLICY IF EXISTS "opex_all_access" ON public.opex;
DROP POLICY IF EXISTS "opex_full_access" ON public.opex;

-- Dropar índices
DROP INDEX IF EXISTS idx_opex_departamento;
DROP INDEX IF EXISTS idx_opex_status;
DROP INDEX IF EXISTS idx_opex_data_prevista;
DROP INDEX IF EXISTS public.idx_opex_departamento;
DROP INDEX IF EXISTS public.idx_opex_status;
DROP INDEX IF EXISTS public.idx_opex_data_prevista;

-- Remover a tabela completamente
DROP TABLE IF EXISTS public.opex CASCADE;
DROP TABLE IF EXISTS opex CASCADE;

-- CRIAR TABELA NOVA - LIMPA
CREATE TABLE public.opex (
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
CREATE INDEX idx_opex_departamento ON public.opex(departamento);
CREATE INDEX idx_opex_status ON public.opex(status);
CREATE INDEX idx_opex_data_prevista ON public.opex(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE public.opex ENABLE ROW LEVEL SECURITY;

-- UMA ÚNICA POLÍTICA SIMPLES
CREATE POLICY "opex_access" ON public.opex FOR ALL USING (true) WITH CHECK (true);

-- Função para updated_at
CREATE OR REPLACE FUNCTION public.update_opex_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_opex_updated_at BEFORE UPDATE ON public.opex FOR EACH ROW EXECUTE FUNCTION public.update_opex_updated_at();
