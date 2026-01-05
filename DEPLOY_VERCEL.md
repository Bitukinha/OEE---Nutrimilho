# Deploy para Vercel - Instruções Manuais

## Resumo das Alterações
- ✅ Adicionado logo Nutrimilho no canto superior direito de todos os PDFs (Relatórios OEE, Qualidade e Paradas)
- ✅ Atualizado hook `useOEEPorTurno` para descontar paradas por registro ao calcular disponibilidade
- ✅ Build testada e validada (`npm run build` com sucesso)

## Comandos Git (Execute no Terminal)

Abra o terminal PowerShell na pasta do projeto e execute os comandos abaixo em sequência:

### 1. Verificar Status
```powershell
git status
```

### 2. Adicionar Arquivos Modificados
```powershell
git add -A
```

### 3. Criar Commit
```powershell
git commit -m "feat: adicionar logo Nutrimilho nos PDFs e corrigir cálculo de disponibilidade por parada"
```

### 4. Fazer Push para o Repositório Remoto
```powershell
git push origin main
```

> **Nota:** Se você usar branch diferente (como `develop` ou outra), substitua `main` pelo nome da sua branch.

## Vercel - Passos Automáticos

Após fazer push (`git push`), o Vercel:
1. Detectará automaticamente o novo commit
2. Iniciará um novo build
3. Executará `npm run build` (conforme configurado no seu projeto)
4. Implantará a nova versão automaticamente

Você pode monitorar o progresso no dashboard do Vercel: https://vercel.com

## Variáveis de Ambiente (Já Configuradas?)

Verifique se as seguintes variáveis estão definidas no Vercel (Project Settings → Environment Variables):

- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anon pública do Supabase

Se não estiverem, adicione-as antes de fazer o push.

## Verificação Pós-Deploy

1. Acesse a URL do seu projeto Vercel
2. Teste a geração de PDFs (Relatório OEE, Qualidade, Paradas)
3. Confirme que a logo aparece no canto superior direito de cada PDF
4. Verifique os valores de disponibilidade nos cards do dashboard (devem refletir as paradas descontadas)

---

**Status:** Pronto para deploy ✅
