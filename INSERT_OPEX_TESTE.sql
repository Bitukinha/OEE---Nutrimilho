-- Inserir dados de teste na tabela operacoes_extras
INSERT INTO operacoes_extras (departamento, descricao, data_inicio, data_prevista_termino, status)
VALUES
  ('Manutenção', 'Revisão geral da máquina CNC 01', '2026-01-20', '2026-02-10', 'em_progresso'),
  ('Qualidade', 'Implementação de novo padrão de inspeção', '2026-01-25', '2026-02-15', 'pendente'),
  ('Produção', 'Otimização do fluxo de produção linha 2', '2026-01-15', '2026-02-05', 'em_progresso'),
  ('Processos', 'Documentação de novos processos', '2026-01-28', '2026-02-28', 'pendente'),
  ('TI', 'Atualização do sistema de gestão', '2026-01-10', '2026-01-31', 'pronto'),
  ('Compras', 'Negociação de fornecedores', '2026-02-01', '2026-02-20', 'pendente'),
  ('Almoxarifado', 'Inventário completo do estoque', '2026-01-22', '2026-02-08', 'em_progresso'),
  ('RH', 'Treinamento de novos colaboradores', '2026-01-18', '2026-02-25', 'em_progresso');

-- Verificar dados inseridos:
-- SELECT * FROM operacoes_extras;
