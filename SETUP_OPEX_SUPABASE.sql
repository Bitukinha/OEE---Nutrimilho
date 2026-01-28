-- Execute este script no SQL Editor do Supabase em: https://app.supabase.com/project/ybsggyebznuseonnvcgy/sql/new

-- 1. Remover tabela antiga se existir (cuidado: isso deleta dados!)
DROP TABLE IF EXISTS public.opex CASCADE;

-- 2. Criar a tabela opex
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

-- 3. Criar índices
CREATE INDEX idx_opex_departamento ON public.opex(departamento);
CREATE INDEX idx_opex_status ON public.opex(status);
CREATE INDEX idx_opex_data_prevista ON public.opex(data_prevista_termino);

-- 4. Habilitar RLS
ALTER TABLE public.opex ENABLE ROW LEVEL SECURITY;

-- 5. Criar política para permitir acesso completo
CREATE POLICY "opex_all_access" ON public.opex
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_opex_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_opex_updated_at ON public.opex;
CREATE TRIGGER update_opex_updated_at
  BEFORE UPDATE ON public.opex
  FOR EACH ROW
  EXECUTE FUNCTION public.update_opex_updated_at();

-- 8. (Opcional) Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.opex;

-- Pronto! A tabela opex está configurada.
