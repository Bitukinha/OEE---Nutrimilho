-- Execute CADA linha separadamente no Supabase SQL Editor
-- Copie uma linha por vez e clique em RUN

-- 1. Dropar tabela antiga (se existir)
DROP TABLE IF EXISTS public.operacoes_extras CASCADE;

-- 2. Criar tabela
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

-- 3. Habilitar RLS
ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

-- 4. Criar política
CREATE POLICY "operacoes_policy" ON public.operacoes_extras FOR ALL USING (true) WITH CHECK (true);

-- 5. Criar índices
CREATE INDEX idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX idx_operacoes_extras_status ON public.operacoes_extras(status);

-- 6. Criar função para updated_at
CREATE OR REPLACE FUNCTION public.update_operacoes_extras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger
CREATE TRIGGER update_operacoes_extras_updated_at BEFORE UPDATE ON public.operacoes_extras FOR EACH ROW EXECUTE FUNCTION public.update_operacoes_extras_updated_at();

-- Pronto! Agora testa com essa query simples:
-- SELECT * FROM public.operacoes_extras;
