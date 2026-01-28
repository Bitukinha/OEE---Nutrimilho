-- Consolidar e garantir que a tabela opex está corretamente configurada
-- Dropar a tabela se existir com configurações antigas
DROP TABLE IF EXISTS opex CASCADE;
DROP TABLE IF EXISTS public.opex CASCADE;

-- Recriar tabela opex com configuração correta
CREATE TABLE public.opex (
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
CREATE INDEX idx_opex_departamento ON public.opex(departamento);
CREATE INDEX idx_opex_status ON public.opex(status);
CREATE INDEX idx_opex_data_prevista ON public.opex(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE public.opex ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Allow all operations on opex" ON public.opex;
DROP POLICY IF EXISTS "Allow all operations on opex for anon" ON public.opex;
DROP POLICY IF EXISTS "Allow public read access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public insert access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public update access to opex" ON public.opex;
DROP POLICY IF EXISTS "Allow public delete access to opex" ON public.opex;

-- Política única para permitir todas operações (simplificado para OPEX sem dados sensíveis)
CREATE POLICY "opex_all_access" ON public.opex
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar ou recriar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_opex_updated_at()
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
  EXECUTE FUNCTION public.update_opex_updated_at();

-- Habilitar Realtime para a tabela (opcional, para atualizações em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.opex;
