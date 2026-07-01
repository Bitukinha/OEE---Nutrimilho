# OEE Insight Dashboard - Nutrimilho

Sistema de gestão e monitoramento de OEE (Overall Equipment Effectiveness) para a Nutrimilho.

## Sobre o Projeto

Dashboard em tempo real para acompanhamento de:

- **Produção**: Registros de produção com cálculo automático de OEE
- **Paradas**: Rastreamento de downtime com análise de Pareto
- **Qualidade**: Monitoramento de produtos bloqueados e tendências
- **Equipamentos**: Gestão de máquinas e sua capacidade
- **Relatórios**: Exportação em PDF de todas as análises

## Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn-ui components
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Gráficos**: Recharts
- **Formulários**: React Hook Form + Zod
- **Estado**: TanStack React Query
- **PDF**: jsPDF + autotable

## Como Usar Localmente

### Requisitos

- Node.js & npm instalados

### Instalação

```sh
# 1. Clone o repositório
git clone <seu-git-url>

# 2. Navegue até o diretório
cd oee-insight-dashboard-main

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Crie um arquivo .env.local com suas credenciais Supabase:
# VITE_SUPABASE_URL=sua-url
# VITE_SUPABASE_PUBLISHABLE_KEY=sua-key

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

### Backup do banco de dados

O repositório inclui um script de exemplo em `scripts/backup-db.sh`. Basta definir a variável de ambiente `SUPABASE_DB_URL` com a URL de conexão (ex: `postgres://user:password@host:port/dbname`) e executar:

```sh
# em *nix ou WSL/Git Bash no Windows
./scripts/backup-db.sh dump-$(date +%Y%m%d).dump
```

O arquivo gerado estará em formato custom e pode ser restaurado com `pg_restore`. Você também pode chamar `pg_dump` diretamente:

```sh
pg_dump --format=custom --file=meu_backup.dump "$SUPABASE_DB_URL"
```

```
O projeto estará disponível em `http://localhost:8082`

## Deploy

Para fazer deploy na Vercel:

1. Push o código para GitHub
2. Acesse [Vercel.com](https://vercel.com)
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente no painel da Vercel
5. Deploy automático será realizado

## Licença

© 2026 Nutrimilho - Sistema de Gestão OEE (Novaes Tech)
```
