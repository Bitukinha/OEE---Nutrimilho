-- Tabela de segmentos/equipamentos (caso não exista no projeto)
CREATE TABLE IF NOT EXISTS public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT,
  ciclo_ideal DECIMAL(10,2) DEFAULT 2.5,
  capacidade_hora INTEGER DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Allow public insert on equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Allow public update on equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Allow public delete on equipamentos" ON public.equipamentos;

CREATE POLICY "Allow public read access on equipamentos" ON public.equipamentos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on equipamentos" ON public.equipamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on equipamentos" ON public.equipamentos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on equipamentos" ON public.equipamentos FOR DELETE USING (true);

-- Trigger updated_at (usa função genérica se existir, senão cria)
CREATE OR REPLACE FUNCTION public.update_equipamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_equipamentos_updated_at ON public.equipamentos;
CREATE TRIGGER update_equipamentos_updated_at
  BEFORE UPDATE ON public.equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_equipamentos_updated_at();

COMMENT ON TABLE public.equipamentos IS 'Segmentos/equipamentos de produção (OEE)';
