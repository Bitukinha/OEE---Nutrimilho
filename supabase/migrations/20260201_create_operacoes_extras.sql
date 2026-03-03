-- Criar tabela operacoes_extras
CREATE TABLE IF NOT EXISTS public.operacoes_extras (
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
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_status ON public.operacoes_extras(status);
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_data_prevista ON public.operacoes_extras(data_prevista_termino);

-- Habilitar Row Level Security
ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita completa
DROP POLICY IF EXISTS "Allow all operations on operacoes_extras" ON public.operacoes_extras;
CREATE POLICY "Allow all operations on operacoes_extras" ON public.operacoes_extras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_operacoes_extras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_operacoes_extras_updated_at ON public.operacoes_extras;
CREATE TRIGGER update_operacoes_extras_updated_at
  BEFORE UPDATE ON public.operacoes_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_operacoes_extras_updated_at();

-- Função RPC para buscar operacoes_extras (compatibilidade)
CREATE OR REPLACE FUNCTION public.get_operacoes_extras()
RETURNS TABLE (
  id UUID,
  departamento TEXT,
  descricao TEXT,
  data_inicio DATE,
  data_prevista_termino DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY SELECT 
    operacoes_extras.id,
    operacoes_extras.departamento,
    operacoes_extras.descricao,
    operacoes_extras.data_inicio,
    operacoes_extras.data_prevista_termino,
    operacoes_extras.status,
    operacoes_extras.created_at,
    operacoes_extras.updated_at
  FROM public.operacoes_extras
  ORDER BY operacoes_extras.data_prevista_termino ASC;
END;
$$ LANGUAGE plpgsql;

-- Função RPC para inserir nova operação extra
CREATE OR REPLACE FUNCTION public.insert_operacao_extra(
  p_departamento TEXT,
  p_descricao TEXT,
  p_data_inicio DATE,
  p_data_prevista_termino DATE,
  p_status TEXT DEFAULT 'pendente'
)
RETURNS TABLE (
  id UUID,
  departamento TEXT,
  descricao TEXT,
  data_inicio DATE,
  data_prevista_termino DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.operacoes_extras (
    departamento,
    descricao,
    data_inicio,
    data_prevista_termino,
    status
  ) VALUES (
    p_departamento,
    p_descricao,
    p_data_inicio,
    p_data_prevista_termino,
    COALESCE(p_status, 'pendente')
  )
  RETURNING
    operacoes_extras.id,
    operacoes_extras.departamento,
    operacoes_extras.descricao,
    operacoes_extras.data_inicio,
    operacoes_extras.data_prevista_termino,
    operacoes_extras.status,
    operacoes_extras.created_at,
    operacoes_extras.updated_at;
END;
$$ LANGUAGE plpgsql;
