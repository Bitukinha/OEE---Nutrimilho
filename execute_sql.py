import requests
import json

url = "https://lmsaeqmxfqqaabwadqkv.supabase.co/rest/v1/rpc/sql"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtc2FlcW14ZnFxYWFid2FkcWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk2OTg4MywiZXhwIjoyMDgyNTQ1ODgzfQ.-4VZK5xtuY5WclMaB18meDWzTpHPiVs7ZqURgZrTmXM"

sql = """CREATE TABLE IF NOT EXISTS public.operacoes_extras (
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

CREATE INDEX IF NOT EXISTS idx_operacoes_extras_departamento ON public.operacoes_extras(departamento);
CREATE INDEX IF NOT EXISTS idx_operacoes_extras_status ON public.operacoes_extras(status);

ALTER TABLE public.operacoes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.operacoes_extras FOR ALL USING (true) WITH CHECK (true);
"""

headers = {
    "Authorization": f"Bearer {token}",
    "apikey": token,
    "Content-Type": "application/json"
}

response = requests.post(url, json={"query": sql}, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
