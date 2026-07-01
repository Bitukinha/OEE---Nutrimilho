DROP TABLE IF EXISTS operacoes_extras;

CREATE TABLE operacoes_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento text NOT NULL,
  descricao text NOT NULL,
  data_inicio date NOT NULL,
  data_prevista_termino date NOT NULL,
  status text DEFAULT 'pendente',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE operacoes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enable_all" ON operacoes_extras FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_dept ON operacoes_extras(departamento);
CREATE INDEX idx_status ON operacoes_extras(status);
