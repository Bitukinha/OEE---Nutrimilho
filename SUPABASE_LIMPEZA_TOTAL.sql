-- LIMPEZA TOTAL - Execute tudo de uma vez

-- Dropar triggers primeiro
DROP TRIGGER IF EXISTS update_operacoes_extras_updated_at ON public.operacoes_extras;

-- Dropar funções
DROP FUNCTION IF EXISTS public.update_operacoes_extras_updated_at();
DROP FUNCTION IF EXISTS public.update_operacoes_extras_updated_at() CASCADE;

-- Dropar policies
DROP POLICY IF EXISTS "operacoes_policy" ON public.operacoes_extras;
DROP POLICY IF EXISTS "Allow all operations" ON public.operacoes_extras;

-- Dropar tabela completamente
DROP TABLE IF EXISTS public.operacoes_extras CASCADE;

-- AGORA CRIAR TUDO DO ZERO

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

ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operacoes_policy" ON public.operacoes_extras FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX idx_operacoes_extras_status ON public.operacoes_extras(status);

CREATE OR REPLACE FUNCTION public.update_operacoes_extras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operacoes_extras_updated_at BEFORE UPDATE ON public.operacoes_extras FOR EACH ROW EXECUTE FUNCTION public.update_operacoes_extras_updated_at();
