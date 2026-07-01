# Adição de Novos Motivos de Paradas

## Resumo das Mudanças

Foram adicionados **4 novos motivos de paradas** ao sistema:

### Paradas Não Planejadas (2 novos):
- ✅ **Falta de Mão de Obra** - Parada por falta de mão de obra disponível
- ✅ **Testes (Não Planejado)** - Parada para testes não planejados do equipamento

### Paradas Planejadas (2 novos):
- ✅ **Testes (Planejado)** - Parada planejada para testes do equipamento
- ✅ **Mudança de Setup** - Parada para mudança ou reconfiguração de setup

## Como Aplicar as Mudanças

### Opção 1: Executar via Supabase Console (Recomendado)

1. Acesse o **Supabase Dashboard** (console.supabase.com)
2. Navegue até **SQL Editor**
3. Copie e execute o conteúdo do arquivo `UPDATE_MOTIVOS_PARADAS.sql`
4. Pronto! Os novos motivos estarão disponíveis no sistema

### Opção 2: Através das Migrações (Para Próximo Deploy)

Os novos motivos já foram adicionados aos seguintes arquivos de migração:
- `supabase/migrations/20260105_create_motivos_tables.sql`
- `supabase/migrations/20260105120000_create_motivos_tables.sql`

Na próxima vez que você fizer deploy ou recriar o banco, os novos motivos serão criados automaticamente.

## Verificação

Após executar o SQL, os novos motivos estarão disponíveis nos formulários:
- **Formulário de Paradas** (`ParadaForm.tsx`)
- **Dashboard de Histórico** 
- **Todos os relatórios que filtram por motivos de paradas**

Os novos motivos aparecerão automaticamente nos dropdowns, organizados por categoria:
- Não Planejadas
- Planejadas  
- Manutenção (existentes)
- Setup (existentes + novo)

## Arquivos Modificados

```
supabase/
  migrations/
    20260105_create_motivos_tables.sql ✏️ (atualizado)
    20260105120000_create_motivos_tables.sql ✏️ (atualizado)
    20260127_add_motivos_paradas.sql ✨ (novo)

UPDATE_MOTIVOS_PARADAS.sql ✨ (novo - script para aplicar manualmente)
```

## Próximas Ações

1. ✅ Aplicar o SQL via Supabase Console
2. ✅ Testar os novos motivos na interface
3. ✅ Verificar se aparecem nos relatórios
