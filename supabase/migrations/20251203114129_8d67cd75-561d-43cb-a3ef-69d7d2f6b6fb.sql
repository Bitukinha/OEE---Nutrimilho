-- Create equipment table
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  ciclo_ideal DECIMAL(10,2) NOT NULL DEFAULT 2.5,
  capacidade_hora INTEGER DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shifts table
CREATE TABLE public.turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create production records table
CREATE TABLE public.registros_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  tempo_planejado INTEGER NOT NULL DEFAULT 480,
  tempo_real INTEGER NOT NULL DEFAULT 0,
  tempo_ciclo_ideal DECIMAL(10,2) NOT NULL DEFAULT 2.5,
  tempo_ciclo_real DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_produzido INTEGER NOT NULL DEFAULT 0,
  unidades_boas INTEGER NOT NULL DEFAULT 0,
  defeitos INTEGER NOT NULL DEFAULT 0,
  disponibilidade DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN tempo_planejado > 0 THEN ROUND((tempo_real::DECIMAL / tempo_planejado) * 100, 2) ELSE 0 END
  ) STORED,
  performance DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN tempo_ciclo_real > 0 AND tempo_real > 0 
      THEN ROUND((tempo_ciclo_ideal / tempo_ciclo_real) * 100, 2) 
      ELSE 0 END
  ) STORED,
  qualidade DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_produzido > 0 THEN ROUND((unidades_boas::DECIMAL / total_produzido) * 100, 2) ELSE 0 END
  ) STORED,
  oee DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN tempo_planejado > 0 AND tempo_ciclo_real > 0 AND total_produzido > 0
      THEN ROUND(
        ((tempo_real::DECIMAL / tempo_planejado) * 
        (tempo_ciclo_ideal / tempo_ciclo_real) * 
        (unidades_boas::DECIMAL / total_produzido)) * 100, 2
      )
      ELSE 0 END
  ) STORED,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stop reasons table
CREATE TABLE public.paradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_id UUID NOT NULL REFERENCES public.registros_producao(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  duracao INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'nao_planejada' CHECK (categoria IN ('planejada', 'nao_planejada', 'qualidade')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is an internal system)
CREATE POLICY "Allow public read access on equipamentos" ON public.equipamentos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on equipamentos" ON public.equipamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on equipamentos" ON public.equipamentos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on equipamentos" ON public.equipamentos FOR DELETE USING (true);

CREATE POLICY "Allow public read access on turnos" ON public.turnos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on turnos" ON public.turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on turnos" ON public.turnos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on turnos" ON public.turnos FOR DELETE USING (true);

CREATE POLICY "Allow public read access on registros_producao" ON public.registros_producao FOR SELECT USING (true);
CREATE POLICY "Allow public insert on registros_producao" ON public.registros_producao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on registros_producao" ON public.registros_producao FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on registros_producao" ON public.registros_producao FOR DELETE USING (true);

CREATE POLICY "Allow public read access on paradas" ON public.paradas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on paradas" ON public.paradas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on paradas" ON public.paradas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on paradas" ON public.paradas FOR DELETE USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_equipamentos_updated_at
  BEFORE UPDATE ON public.equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registros_producao_updated_at
  BEFORE UPDATE ON public.registros_producao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shifts
INSERT INTO public.turnos (nome, hora_inicio, hora_fim) VALUES
  ('Manhã', '06:00:00', '14:00:00'),
  ('Tarde', '14:00:00', '22:00:00'),
  ('Noite', '22:00:00', '06:00:00');

-- Insert sample equipment
INSERT INTO public.equipamentos (nome, codigo, ciclo_ideal, capacidade_hora) VALUES
  ('Linha 1 - Extrusão', 'EXT-001', 2.5, 120),
  ('Linha 2 - Empacotamento', 'EMP-001', 1.8, 200),
  ('Linha 3 - Moagem', 'MOA-001', 3.0, 100),
  ('Linha 4 - Secagem', 'SEC-001', 4.0, 80);