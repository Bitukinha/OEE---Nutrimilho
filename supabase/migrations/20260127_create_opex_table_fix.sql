-- Criar tabela opex se não existir
CREATE TABLE IF NOT EXISTS public.opex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'pronto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_opex_departamento ON public.opex(departamento);
CREATE INDEX IF NOT EXISTS idx_opex_status ON public.opex(status);
CREATE INDEX IF NOT EXISTS idx_opex_data_prevista ON public.opex(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE public.opex ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita completa
DROP POLICY IF EXISTS "Allow all operations on opex" ON public.opex;
CREATE POLICY "Allow all operations on opex" ON public.opex
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_opex_updated_at ON public.opex;
CREATE TRIGGER update_opex_updated_at
  BEFORE UPDATE ON public.opex
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
