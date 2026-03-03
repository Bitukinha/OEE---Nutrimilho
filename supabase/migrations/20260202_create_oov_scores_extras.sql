-- Criar tabela oov_scores_extras para armazenar scores OEE de operações extras
CREATE TABLE IF NOT EXISTS public.oov_scores_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'pronto')),
  concluido BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_oov_scores_extras_departamento ON public.oov_scores_extras(departamento);
CREATE INDEX IF NOT EXISTS idx_oov_scores_extras_status ON public.oov_scores_extras(status);
CREATE INDEX IF NOT EXISTS idx_oov_scores_extras_data_prevista ON public.oov_scores_extras(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE public.oov_scores_extras ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita completa
DROP POLICY IF EXISTS "Allow all operations on oov_scores_extras" ON public.oov_scores_extras;
CREATE POLICY "Allow all operations on oov_scores_extras" ON public.oov_scores_extras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_oov_scores_extras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_oov_scores_extras_updated_at ON public.oov_scores_extras;
CREATE TRIGGER update_oov_scores_extras_updated_at
  BEFORE UPDATE ON public.oov_scores_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_oov_scores_extras_updated_at();
