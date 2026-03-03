-- ============================================================
-- TABELAS: Produção, Paradas, Qualidade (OEE)
-- Ordem: turnos -> equipamentos (já existe) -> registros_producao -> paradas -> produtos_bloqueados
-- ============================================================

-- 1. TURNOS (necessário para Produção, Paradas e Qualidade)
CREATE TABLE IF NOT EXISTS public.turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  meta_oee NUMERIC(5,2) NOT NULL DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on turnos" ON public.turnos;
DROP POLICY IF EXISTS "Allow public insert on turnos" ON public.turnos;
DROP POLICY IF EXISTS "Allow public update on turnos" ON public.turnos;
DROP POLICY IF EXISTS "Allow public delete on turnos" ON public.turnos;
CREATE POLICY "Allow public read access on turnos" ON public.turnos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on turnos" ON public.turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on turnos" ON public.turnos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on turnos" ON public.turnos FOR DELETE USING (true);

-- Adicionar meta_oee se a tabela turnos já existir sem a coluna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'turnos' AND column_name = 'meta_oee'
  ) THEN
    ALTER TABLE public.turnos ADD COLUMN meta_oee NUMERIC(5,2) NOT NULL DEFAULT 85;
  END IF;
END $$;

-- 2. REGISTROS_PRODUCAO (Produção) – depende de equipamentos e turnos
CREATE TABLE IF NOT EXISTS public.registros_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  tempo_planejado INTEGER NOT NULL DEFAULT 480,
  tempo_real INTEGER NOT NULL DEFAULT 0,
  tempo_ciclo_ideal DECIMAL(10,2) NOT NULL DEFAULT 2.5,
  tempo_ciclo_real DECIMAL(10,2) NOT NULL DEFAULT 0,
  capacidade_hora INTEGER NOT NULL DEFAULT 100,
  total_produzido INTEGER NOT NULL DEFAULT 0,
  defeitos INTEGER NOT NULL DEFAULT 0,
  disponibilidade DECIMAL(5,2) DEFAULT 0,
  performance DECIMAL(5,2) DEFAULT 0,
  qualidade DECIMAL(5,2) DEFAULT 0,
  oee DECIMAL(5,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registros_producao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on registros_producao" ON public.registros_producao;
DROP POLICY IF EXISTS "Allow public insert on registros_producao" ON public.registros_producao;
DROP POLICY IF EXISTS "Allow public update on registros_producao" ON public.registros_producao;
DROP POLICY IF EXISTS "Allow public delete on registros_producao" ON public.registros_producao;
CREATE POLICY "Allow public read access on registros_producao" ON public.registros_producao FOR SELECT USING (true);
CREATE POLICY "Allow public insert on registros_producao" ON public.registros_producao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on registros_producao" ON public.registros_producao FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on registros_producao" ON public.registros_producao FOR DELETE USING (true);

-- Trigger updated_at registros_producao
CREATE OR REPLACE FUNCTION public.update_registros_producao_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_registros_producao_updated_at ON public.registros_producao;
CREATE TRIGGER update_registros_producao_updated_at
  BEFORE UPDATE ON public.registros_producao
  FOR EACH ROW EXECUTE FUNCTION public.update_registros_producao_updated_at();

-- Adicionar capacidade_hora se a tabela já existir sem a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registros_producao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registros_producao' AND column_name = 'capacidade_hora')
  THEN
    ALTER TABLE public.registros_producao ADD COLUMN capacidade_hora INTEGER NOT NULL DEFAULT 100;
  END IF;
END $$;

-- 3. PARADAS – depende de turnos, equipamentos e opcionalmente registros_producao
CREATE TABLE IF NOT EXISTS public.paradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id) ON DELETE SET NULL,
  equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  registro_id UUID REFERENCES public.registros_producao(id) ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  duracao INTEGER NOT NULL DEFAULT 0,
  motivo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'nao_planejada' CHECK (categoria IN ('planejada', 'nao_planejada', 'manutencao', 'setup', 'qualidade')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on paradas" ON public.paradas;
DROP POLICY IF EXISTS "Allow public insert on paradas" ON public.paradas;
DROP POLICY IF EXISTS "Allow public update on paradas" ON public.paradas;
DROP POLICY IF EXISTS "Allow public delete on paradas" ON public.paradas;
CREATE POLICY "Allow public read access on paradas" ON public.paradas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on paradas" ON public.paradas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on paradas" ON public.paradas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on paradas" ON public.paradas FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_paradas_data ON public.paradas(data);
CREATE INDEX IF NOT EXISTS idx_paradas_turno_id ON public.paradas(turno_id);
CREATE INDEX IF NOT EXISTS idx_paradas_equipamento_id ON public.paradas(equipamento_id);

-- Se paradas já existir com schema antigo (registro_id NOT NULL), tornar nullable
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paradas' AND column_name = 'registro_id') THEN
    ALTER TABLE public.paradas ALTER COLUMN registro_id DROP NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paradas' AND column_name = 'turno_id') THEN
    ALTER TABLE public.paradas ADD COLUMN turno_id UUID REFERENCES public.turnos(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paradas' AND column_name = 'equipamento_id') THEN
    ALTER TABLE public.paradas ADD COLUMN equipamento_id UUID REFERENCES public.equipamentos(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paradas' AND column_name = 'data') THEN
    ALTER TABLE public.paradas ADD COLUMN data DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 4. PRODUTOS_BLOQUEADOS (Qualidade)
CREATE TABLE IF NOT EXISTS public.produtos_bloqueados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  turno_id UUID REFERENCES public.turnos(id) ON DELETE SET NULL,
  equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  motivo_bloqueio TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  numero_lacre TEXT,
  destino TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos_bloqueados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on produtos_bloqueados" ON public.produtos_bloqueados;
DROP POLICY IF EXISTS "Allow public insert on produtos_bloqueados" ON public.produtos_bloqueados;
DROP POLICY IF EXISTS "Allow public update on produtos_bloqueados" ON public.produtos_bloqueados;
DROP POLICY IF EXISTS "Allow public delete on produtos_bloqueados" ON public.produtos_bloqueados;
CREATE POLICY "Allow public read access on produtos_bloqueados" ON public.produtos_bloqueados FOR SELECT USING (true);
CREATE POLICY "Allow public insert on produtos_bloqueados" ON public.produtos_bloqueados FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on produtos_bloqueados" ON public.produtos_bloqueados FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on produtos_bloqueados" ON public.produtos_bloqueados FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_produtos_bloqueados_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_produtos_bloqueados_updated_at ON public.produtos_bloqueados;
CREATE TRIGGER update_produtos_bloqueados_updated_at
  BEFORE UPDATE ON public.produtos_bloqueados
  FOR EACH ROW EXECUTE FUNCTION public.update_produtos_bloqueados_updated_at();

CREATE INDEX IF NOT EXISTS idx_produtos_bloqueados_data ON public.produtos_bloqueados(data);
CREATE INDEX IF NOT EXISTS idx_produtos_bloqueados_turno_id ON public.produtos_bloqueados(turno_id);
CREATE INDEX IF NOT EXISTS idx_produtos_bloqueados_equipamento_id ON public.produtos_bloqueados(equipamento_id);

-- Dados iniciais: turnos (apenas se vazia)
INSERT INTO public.turnos (nome, hora_inicio, hora_fim, meta_oee)
SELECT 'Turno A', '06:00'::TIME, '14:00'::TIME, 85
WHERE NOT EXISTS (SELECT 1 FROM public.turnos LIMIT 1);
INSERT INTO public.turnos (nome, hora_inicio, hora_fim, meta_oee)
SELECT 'Turno B', '14:00'::TIME, '22:00'::TIME, 85
WHERE (SELECT COUNT(*) FROM public.turnos) < 2;
INSERT INTO public.turnos (nome, hora_inicio, hora_fim, meta_oee)
SELECT 'Turno C', '22:00'::TIME, '06:00'::TIME, 85
WHERE (SELECT COUNT(*) FROM public.turnos) < 3;
