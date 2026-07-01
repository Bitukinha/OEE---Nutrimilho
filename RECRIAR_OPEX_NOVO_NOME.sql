-- Criar tabela com nome diferente para evitar cache do Supabase
DROP TABLE IF EXISTS public.opex_atividades CASCADE;

CREATE TABLE public.opex_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  concluido BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Copiar dados da tabela antiga se existir
INSERT INTO public.opex_atividades (id, departamento, descricao, data_inicio, data_prevista_termino, status, concluido, data_conclusao, created_at, updated_at)
SELECT id, departamento, descricao, data_inicio, data_prevista_termino, status, concluido, data_conclusao, created_at, updated_at
FROM public.operacoes_extras
ON CONFLICT (id) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_opex_atividades_departamento ON public.opex_atividades(departamento);
CREATE INDEX IF NOT EXISTS idx_opex_atividades_status ON public.opex_atividades(status);

-- RLS
ALTER TABLE public.opex_atividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON public.opex_atividades;
CREATE POLICY "Public access" ON public.opex_atividades
  FOR ALL USING (true) WITH CHECK (true);
