-- Criar tabela operacoes_extras (versão simplificada)
CREATE TABLE IF NOT EXISTS public.operacoes_extras (
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_status ON public.operacoes_extras(status);

-- Habilitar RLS
ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

-- Policy simples
CREATE POLICY "Allow all" ON public.operacoes_extras FOR ALL USING (true) WITH CHECK (true);
