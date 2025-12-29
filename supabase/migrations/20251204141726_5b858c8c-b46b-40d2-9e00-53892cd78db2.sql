
-- Adicionar campos para registrar paradas diretamente por turno e segmento
ALTER TABLE paradas 
ADD COLUMN turno_id uuid REFERENCES turnos(id),
ADD COLUMN equipamento_id uuid REFERENCES equipamentos(id),
ADD COLUMN data date DEFAULT CURRENT_DATE;

-- Tornar registro_id opcional (pode ser null para paradas registradas diretamente)
ALTER TABLE paradas 
ALTER COLUMN registro_id DROP NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX idx_paradas_turno ON paradas(turno_id);
CREATE INDEX idx_paradas_equipamento ON paradas(equipamento_id);
CREATE INDEX idx_paradas_data ON paradas(data);
