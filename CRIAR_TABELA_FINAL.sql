-- EXECUTE TUDO ISSO DE UMA VEZ NO SUPABASE SQL EDITOR
-- Link: https://supabase.com/dashboard

BEGIN;

-- Dropar tudo antigo
DROP TRIGGER IF EXISTS update_operacoes_extras_updated_at ON public.operacoes_extras CASCADE;
DROP FUNCTION IF EXISTS public.update_operacoes_extras_updated_at() CASCADE;
DROP POLICY IF EXISTS "operacoes_policy" ON public.operacoes_extras;
DROP TABLE IF EXISTS public.operacoes_extras CASCADE;

-- Criar tabela
CREATE TABLE public.operacoes_extras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento text NOT NULL,
  descricao text NOT NULL,
  data_inicio date NOT NULL,
  data_prevista_termino date NOT NULL,
  status text NOT NULL DEFAULT 'pendente'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

-- Criar policy
CREATE POLICY "operacoes_policy" ON public.operacoes_extras FOR ALL USING (true) WITH CHECK (true);

-- Criar índices
CREATE INDEX idx_operacoes_extras_departamento ON public.operacoes_extras USING btree (departamento);
CREATE INDEX idx_operacoes_extras_status ON public.operacoes_extras USING btree (status);

-- Criar função para updated_at
CREATE OR REPLACE FUNCTION public.update_operacoes_extras_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER update_operacoes_extras_updated_at BEFORE UPDATE ON public.operacoes_extras FOR EACH ROW EXECUTE FUNCTION public.update_operacoes_extras_updated_at();

COMMIT;
