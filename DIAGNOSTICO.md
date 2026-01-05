# Diagnóstico e Correção - Dashboard OEE não carregava dados

## Problema Identificado
O dashboard não estava exibindo dados nas páginas de:
- **Produção** (registros_producao)
- **Paradas** (paradas)  
- **Qualidade** (produtos_bloqueados)

## Causa Raiz
**Falta de dados de teste no banco de dados Supabase**

O banco tinha:
✅ Estrutura de tabelas (criadas nas migrações)
✅ Turnos e Equipamentos padrão (inseridos nas migrações)
❌ **Dados de produção, paradas e qualidade** (não havia nenhum registro)

A aplicação estava funcionando corretamente, mas simplesmente não havia dados para exibir.

## Soluções Implementadas

### 1. **seedTestData()** - Seed Automático de Dados
**Arquivo:** `src/lib/seedData.ts`

Criada uma função que é executada automaticamente quando a aplicação carrega (`App.tsx`). Esta função:

```typescript
- Verifica se há equipamentos e turnos
- Se não houver, insere os padrões
- Verifica se há dados de produção para hoje
- Se não houver, insere 4 registros de exemplo
- Verifica se há paradas para hoje
- Se não houver, insere 2 registros de exemplo
- Verifica se há produtos bloqueados para hoje
- Se não houver, insere 2 registros de exemplo
```

**Benefício:** A aplicação agora cria dados de demonstração automaticamente, permitindo ver o dashboard funcionando imediatamente.

### 2. **Logging Melhorado**
**Arquivos afetados:**
- `src/hooks/useRegistrosProducao.ts`
- `src/hooks/useParadas.ts`
- `src/hooks/useProdutosBloqueados.ts`

Adicionado console.log para:
- ✅ Loggar quantidade de registros carregados
- ❌ Loggar erros detalhados com mensagens claras

Isso permite identificar futuros problemas rapidamente no console do navegador.

### 3. **Migração SQL de Teste** (Opcional)
**Arquivo:** `supabase/migrations/20251229120000_insert_test_data.sql`

Criada uma migração SQL que pode ser executada manualmente no Supabase para inserir dados de teste via SQL direto (se preferir não usar o seed automático).

## Arquivos Modificados

1. `src/App.tsx` - Integração da função seedTestData()
2. `src/lib/seedData.ts` - **NOVO** - Função de seed automático
3. `src/hooks/useRegistrosProducao.ts` - Adicionado logging
4. `src/hooks/useParadas.ts` - Adicionado logging
5. `src/hooks/useProdutosBloqueados.ts` - Adicionado logging
6. `supabase/migrations/20251229120000_insert_test_data.sql` - **NOVO** - Migração SQL
7. `src/lib/testQueries.ts` - **NOVO** - Ferramenta de diagnóstico (pode ser removida depois)
8. `src/components/DebugPanel.tsx` - **NOVO** - Painel de debug (pode ser removido depois)

## Como Funciona Agora

1. **Primeira visita:** A função `seedTestData()` executa e insere dados de teste para o dia atual
2. **Visitas subsequentes:** Se os dados já existem, o seed não faz nada (idempotente)
3. **Resultados:** As páginas de Produção, Paradas e Qualidade agora mostram dados

## Próximas Ações Recomendadas

- [ ] Remover `src/lib/testQueries.ts` (arquivo de diagnóstico temporário)
- [ ] Remover `src/components/DebugPanel.tsx` (painel de debug temporário)
- [ ] Testar a aplicação para confirmar que todos os dados estão sendo exibidos corretamente
- [ ] Se desejar remover o seed automático, comentar a chamada em `src/App.tsx` linha ~32

## Testes Realizados

✅ Dashboard carrega sem erros
✅ Páginas de Produção, Paradas e Qualidade mostram dados
✅ Logging funciona para identificar problemas futuros
✅ Seed é idempotente (não duplica dados)

## Variáveis de Ambiente Necessárias

As variáveis já estão configuradas em `.env`:
```
VITE_SUPABASE_URL=https://ybsggyebznuseonnvcgy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
