-- Script para atualizar motivos de paradas no banco Supabase
-- Execute este SQL no console do Supabase em SQL Editor

-- Verificar motivos existentes
SELECT nome, categoria FROM motivos_paradas WHERE nome ILIKE '%teste%' OR nome ILIKE '%mão%' OR nome ILIKE '%setup%' OR nome ILIKE '%mudança%';

-- Inserir novos motivos se não existirem
INSERT INTO motivos_paradas (nome, categoria, descricao, ativo)
VALUES 
  ('Falta de Mão de Obra', 'nao_planejada', 'Parada por falta de mão de obra disponível', true),
  ('Testes (Não Planejado)', 'nao_planejada', 'Parada para testes não planejados do equipamento', true),
  ('Testes (Planejado)', 'planejada', 'Parada planejada para testes do equipamento', true),
  ('Mudança de Setup', 'setup', 'Parada para mudança ou reconfiguração de setup', true)
ON CONFLICT (nome) DO NOTHING;

-- Verificar se foram inseridos
SELECT nome, categoria, ativo FROM motivos_paradas 
WHERE nome IN ('Falta de Mão de Obra', 'Testes (Não Planejado)', 'Testes (Planejado)', 'Mudança de Setup')
ORDER BY categoria, nome;
