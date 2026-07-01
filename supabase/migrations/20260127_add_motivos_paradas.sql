-- Adicionar novos motivos de paradas

-- Inserir novos motivos de paradas não planejadas
INSERT INTO motivos_paradas (nome, categoria, descricao) VALUES
  ('Falta de Mão de Obra', 'nao_planejada', 'Parada por falta de mão de obra disponível'),
  ('Testes (Não Planejado)', 'nao_planejada', 'Parada para testes não planejados do equipamento')
ON CONFLICT (nome) DO NOTHING;

-- Inserir novos motivos de paradas planejadas
INSERT INTO motivos_paradas (nome, categoria, descricao) VALUES
  ('Testes (Planejado)', 'planejada', 'Parada planejada para testes do equipamento'),
  ('Mudança de Setup', 'setup', 'Parada para mudança ou reconfiguração de setup')
ON CONFLICT (nome) DO NOTHING;
