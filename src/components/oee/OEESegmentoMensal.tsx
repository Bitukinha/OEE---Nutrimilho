import { useMemo, useState } from 'react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Trophy, AlertTriangle, TrendingUp, TrendingDown, Minus, Factory } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOEESegmentoMensal } from '@/hooks/useOEESegmentoMensal';
import type { OEESegmento } from '@/hooks/useOEEPorSegmento';
import { cn } from '@/lib/utils';

const META_OEE = 85;

const getOEEColor = (oee: number) => {
  if (oee >= 85) return 'hsl(142, 76%, 36%)';
  if (oee >= 65) return 'hsl(45, 93%, 47%)';
  return 'hsl(0, 84%, 60%)';
};

const getOEECellClass = (oee: number) => {
  if (oee >= 85) return 'bg-green-500/20 text-green-800 dark:text-green-300';
  if (oee >= 65) return 'bg-amber-400/25 text-amber-800 dark:text-amber-300';
  return 'bg-red-500/20 text-red-800 dark:text-red-300';
};

const LINE_COLORS = [
  'hsl(142, 76%, 36%)',
  'hsl(200, 80%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(25, 90%, 52%)',
  'hsl(340, 75%, 52%)',
  'hsl(175, 70%, 38%)',
  'hsl(45, 93%, 47%)',
  'hsl(220, 15%, 45%)',
];

const mesParaData = (mes: string) => {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(ano, m - 1, 1);
};

const nomeMes = (mes: string, padrao = 'MMMM yyyy') => {
  const texto = format(mesParaData(mes), padrao, { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const mediaOEE = (segmentos: OEESegmento[]) =>
  segmentos.length ? segmentos.reduce((s, x) => s + x.oee, 0) / segmentos.length : null;

const OEESegmentoMensal = () => {
  const mesAtual = format(new Date(), 'yyyy-MM');
  const [mesEscolhido, setMesEscolhido] = useState(mesAtual);
  const [quantidadeMeses, setQuantidadeMeses] = useState(6);

  const { data, isLoading, isError } = useOEESegmentoMensal(mesEscolhido, quantidadeMeses);

  const mudarMes = (delta: number) => {
    const novo = format(addMonths(mesParaData(mesEscolhido), delta), 'yyyy-MM');
    if (novo <= mesAtual) setMesEscolhido(novo);
  };

  const resumo = useMemo(() => {
    if (!data) return null;
    const atual = data.meses[data.meses.length - 1];
    const anterior = data.meses.length > 1 ? data.meses[data.meses.length - 2] : undefined;
    const media = mediaOEE(atual.segmentos);
    const mediaAnterior = anterior ? mediaOEE(anterior.segmentos) : null;
    const anteriorPorEquip = new Map(anterior?.segmentos.map(s => [s.equipamento_id, s.oee]) ?? []);
    return {
      atual,
      anterior,
      media,
      variacao: media !== null && mediaAnterior !== null ? media - mediaAnterior : null,
      melhor: atual.segmentos[0],
      pior: atual.segmentos.length > 1 ? atual.segmentos[atual.segmentos.length - 1] : undefined,
      acimaMeta: atual.segmentos.filter(s => s.oee >= META_OEE).length,
      barras: atual.segmentos.map(s => ({
        nome: s.equipamento_nome,
        oee: s.oee,
        anterior: anteriorPorEquip.get(s.equipamento_id) ?? null,
      })),
    };
  }, [data]);

  // Uma linha por mês, uma coluna por equipamento (formato que o LineChart espera)
  const evolucao = useMemo(() => {
    if (!data) return [];
    return data.meses.map(m => {
      const linha: Record<string, string | number | null> = { mes: nomeMes(m.mes, 'MMM/yy') };
      data.equipamentos.forEach(e => {
        linha[e.id] = m.segmentos.find(s => s.equipamento_id === e.id)?.oee ?? null;
      });
      return linha;
    });
  }, [data]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              OEE Mensal por Segmento
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {nomeMes(mesEscolhido)} comparado aos meses anteriores
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <input
                type="month"
                value={mesEscolhido}
                max={mesAtual}
                onChange={(e) => e.target.value && setMesEscolhido(e.target.value)}
                className="h-10 w-[160px] rounded-md border border-input bg-background px-3 text-sm dark:[color-scheme:dark]"
                aria-label="Escolher mês"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => mudarMes(1)}
                disabled={mesEscolhido >= mesAtual}
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={String(quantidadeMeses)} onValueChange={(v) => setQuantidadeMeses(Number(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            {mesEscolhido !== mesAtual && (
              <Button variant="ghost" size="sm" onClick={() => setMesEscolhido(mesAtual)}>
                Mês atual
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError || !data || !resumo ? (
          <div className="py-16 text-center text-muted-foreground">Erro ao carregar os dados mensais</div>
        ) : (
          <>
            {/* KPIs do mês escolhido */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">OEE médio do mês</p>
                {resumo.media !== null ? (
                  <>
                    <p className="text-2xl font-bold" style={{ color: getOEEColor(resumo.media) }}>
                      {resumo.media.toFixed(1)}%
                    </p>
                    {resumo.variacao !== null && (
                      <p
                        className={cn(
                          'text-xs flex items-center gap-1',
                          resumo.variacao > 0.05 ? 'text-green-600' : resumo.variacao < -0.05 ? 'text-red-500' : 'text-muted-foreground',
                        )}
                      >
                        {resumo.variacao > 0.05 ? <TrendingUp className="h-3 w-3" /> : resumo.variacao < -0.05 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {resumo.variacao > 0 ? '+' : ''}
                        {resumo.variacao.toFixed(1)} p.p. vs mês anterior
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-green-600" /> Melhor segmento
                </p>
                {resumo.melhor ? (
                  <>
                    <p className="text-base font-semibold truncate" title={resumo.melhor.equipamento_nome}>
                      {resumo.melhor.equipamento_nome}
                    </p>
                    <p className="text-sm" style={{ color: getOEEColor(resumo.melhor.oee) }}>{resumo.melhor.oee.toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Precisa melhorar
                </p>
                {resumo.pior ? (
                  <>
                    <p className="text-base font-semibold truncate" title={resumo.pior.equipamento_nome}>
                      {resumo.pior.equipamento_nome}
                    </p>
                    <p className="text-sm" style={{ color: getOEEColor(resumo.pior.oee) }}>{resumo.pior.oee.toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Segmentos na meta (≥ {META_OEE}%)</p>
                <p className="text-2xl font-bold text-primary">
                  {resumo.acimaMeta}
                  <span className="text-base text-muted-foreground font-normal"> / {resumo.atual.segmentos.length}</span>
                </p>
              </div>
            </div>

            {/* OEE por segmento no mês escolhido */}
            <div>
              <h3 className="font-semibold text-sm mb-2">OEE por segmento — {nomeMes(mesEscolhido)}</h3>
              {resumo.barras.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumo.barras} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="nome" angle={-30} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(v: number, name: string) => [v === null ? '—' : `${v.toFixed(1)}%`, name]} />
                      <Legend verticalAlign="top" height={30} />
                      <ReferenceLine y={META_OEE} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                      {resumo.anterior && (
                        <Bar dataKey="anterior" name="Mês anterior" fill="hsl(var(--muted-foreground))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                      )}
                      <Bar dataKey="oee" name="OEE do mês" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {resumo.barras.map((b, i) => (
                          <Cell key={i} fill={getOEEColor(b.oee)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem registros de produção em {nomeMes(mesEscolhido)}
                </div>
              )}
            </div>

            {/* Evolução mês a mês */}
            {data.equipamentos.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Evolução mensal por segmento</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucao} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} />
                      <Legend />
                      <ReferenceLine y={META_OEE} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                      {data.equipamentos.map((e, i) => (
                        <Line
                          key={e.id}
                          type="monotone"
                          dataKey={e.id}
                          name={e.nome}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tabela mês x segmento — clique no mês para abri-lo */}
            {data.equipamentos.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Tabela mensal <span className="font-normal text-muted-foreground">(clique em um mês para ver os detalhes)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left font-medium p-2 sticky left-0 bg-muted min-w-[140px]">Segmento</th>
                        {data.meses.map(m => (
                          <th key={m.mes} className="p-1 font-medium whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setMesEscolhido(m.mes)}
                              className={cn(
                                'rounded px-2 py-1 hover:bg-primary/10',
                                m.mes === mesEscolhido && 'bg-primary text-primary-foreground hover:bg-primary',
                              )}
                            >
                              {nomeMes(m.mes, 'MMM/yy')}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.equipamentos.map(e => (
                        <tr key={e.id} className="border-t">
                          <td className="p-2 sticky left-0 bg-background font-medium">{e.nome}</td>
                          {data.meses.map(m => {
                            const seg = m.segmentos.find(s => s.equipamento_id === e.id);
                            return (
                              <td key={m.mes} className="p-1 text-center">
                                {seg ? (
                                  <span
                                    className={cn('inline-block rounded px-2 py-1 font-semibold tabular-nums', getOEECellClass(seg.oee))}
                                    title={`D ${seg.disponibilidade}% · P ${seg.performance}% · Q ${seg.qualidade}% · ${seg.total_produzido} un`}
                                  >
                                    {seg.oee.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/30">
                        <td className="p-2 sticky left-0 bg-muted font-semibold">Média</td>
                        {data.meses.map(m => {
                          const media = mediaOEE(m.segmentos);
                          return (
                            <td key={m.mes} className="p-1 text-center font-semibold tabular-nums">
                              {media !== null ? `${media.toFixed(1)}%` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OEESegmentoMensal;
