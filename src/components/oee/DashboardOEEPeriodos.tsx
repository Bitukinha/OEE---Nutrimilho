import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useOEEPeriodos } from '@/hooks/useOEEPeriodos';
import { cn } from '@/lib/utils';
import { getOEEColor, getOEELevel } from '@/types/oee';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart } from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

type PeriodoType = 'semana' | 'mes' | 'ano';

const DashboardOEEPeriodos = () => {
  const { data, isLoading } = useOEEPeriodos();
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoType>('mes');
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('geral');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  // Filtrar dados do período selecionado
  const filtrarPorPeriodo = (periodoType: PeriodoType) => {
    const mapeoPeriodo: Record<PeriodoType, string[]> = {
      semana: ['Semana Atual', 'Semana -1', 'Semana -2', 'Semana -3'],
      mes: ['Mês Atual', 'Mês -1', 'Mês -2', 'Mês -3', 'Mês -4', 'Mês -5', 'Mês -6', 'Mês -7', 'Mês -8', 'Mês -9', 'Mês -10', 'Mês -11'],
      ano: ['Ano Atual', 'Ano -1'],
    };

    return data.geral.filter(p => mapeoPeriodo[periodoType].includes(p.periodo));
  };

  const dadosPeriodo = filtrarPorPeriodo(periodoSelecionado);

  // Dados do segmento selecionado
  let dadosSegmento = null;
  if (segmentoSelecionado !== 'geral') {
    dadosSegmento = data.porSegmento.find(s => s.equipamento_id === segmentoSelecionado);
  }

  // Preparar dados para o gráfico
  const chartData = dadosPeriodo.map(p => ({
    periodo: p.periodo,
    oee: p.oee,
    disponibilidade: p.disponibilidade,
    performance: p.performance,
    qualidade: p.qualidade,
  }));

  // Dados do segmento para gráfico (se selecionado)
  const chartDataSegmento = dadosSegmento
    ? dadosSegmento.periodos
      .filter(p => {
        const mapeoPeriodo: Record<PeriodoType, string[]> = {
          semana: ['Semana Atual', 'Semana -1', 'Semana -2', 'Semana -3'],
          mes: ['Mês Atual', 'Mês -1', 'Mês -2', 'Mês -3', 'Mês -4', 'Mês -5', 'Mês -6', 'Mês -7', 'Mês -8', 'Mês -9', 'Mês -10', 'Mês -11'],
          ano: ['Ano Atual', 'Ano -1'],
        };
        return mapeoPeriodo[periodoSelecionado].includes(p.periodo);
      })
      .map(p => ({
        periodo: p.periodo,
        oee: p.oee,
        disponibilidade: p.disponibilidade,
        performance: p.performance,
        qualidade: p.qualidade,
      }))
    : [];

  // Calcular estatísticas
  const calcularStats = (dados: typeof chartData) => {
    if (dados.length === 0) return { media: 0, max: 0, min: 0, tendencia: 'stable' as const };

    const oeeValues = dados.map(d => d.oee);
    const media = oeeValues.reduce((a, b) => a + b, 0) / oeeValues.length;
    const max = Math.max(...oeeValues);
    const min = Math.min(...oeeValues);

    // Tendência (primeira vs segunda metade)
    let tendencia: 'up' | 'down' | 'stable' = 'stable';
    if (dados.length >= 2) {
      const primeira = dados.slice(0, Math.floor(dados.length / 2));
      const segunda = dados.slice(Math.floor(dados.length / 2));
      const mediaP = primeira.reduce((a, b) => a + b.oee, 0) / primeira.length;
      const mediaS = segunda.reduce((a, b) => a + b.oee, 0) / segunda.length;
      if (mediaS > mediaP) tendencia = 'up';
      else if (mediaS < mediaP) tendencia = 'down';
    }

    return { media, max, min, tendencia };
  };

  const statsGeral = calcularStats(chartData);
  const statsSegmento = calcularStats(chartDataSegmento);

  return (
    <div className="space-y-6">
      {/* Seleção de Período */}
      <Tabs value={periodoSelecionado} onValueChange={(v) => setPeriodoSelecionado(v as PeriodoType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="semana">Semanal</TabsTrigger>
          <TabsTrigger value="mes">Mensal</TabsTrigger>
          <TabsTrigger value="ano">Anual</TabsTrigger>
        </TabsList>

        {['semana', 'mes', 'ano'].map(periodo => (
          <TabsContent key={periodo} value={periodo} className="space-y-6">
            {/* Card OEE Geral */}
            <Card variant="gradient">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>OEE Geral - {periodo === 'semana' ? 'Últimas 4 Semanas' : periodo === 'mes' ? 'Últimos 12 Meses' : 'Últimos 2 Anos'}</CardTitle>
                  <div className="flex items-center gap-2">
                    {statsGeral.tendencia === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
                    {statsGeral.tendencia === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gráfico de Linha - Geral */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="periodo"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="oee"
                        name="OEE"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ fill: '#16a34a', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="disponibilidade"
                        name="Disponibilidade"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#3b82f6', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="performance"
                        name="Performance"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#f59e0b', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="qualidade"
                        name="Qualidade"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#10b981', r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Média</p>
                    <p className={cn('text-2xl font-bold', getOEEColor(statsGeral.media))}>
                      {statsGeral.media.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Máximo</p>
                    <p className={cn('text-2xl font-bold', getOEEColor(statsGeral.max))}>
                      {statsGeral.max.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
                    <p className={cn('text-2xl font-bold', getOEEColor(statsGeral.min))}>
                      {statsGeral.min.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                    <Badge className={cn(
                      'w-full justify-center',
                      statsGeral.tendencia === 'up' && 'bg-success',
                      statsGeral.tendencia === 'down' && 'bg-destructive',
                      statsGeral.tendencia === 'stable' && 'bg-warning',
                    )}>
                      {statsGeral.tendencia === 'up' ? '↑ Subindo' : statsGeral.tendencia === 'down' ? '↓ Caindo' : '→ Estável'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Segmento */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSegmentoSelecionado('geral')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors',
                  segmentoSelecionado === 'geral'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                Visão Geral
              </button>
              {data.porSegmento.map(seg => (
                <button
                  key={seg.equipamento_id}
                  onClick={() => setSegmentoSelecionado(seg.equipamento_id)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors',
                    segmentoSelecionado === seg.equipamento_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {seg.equipamento_nome}
                </button>
              ))}
            </div>

            {/* Card OEE por Segmento */}
            {segmentoSelecionado !== 'geral' && dadosSegmento && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>OEE - {dadosSegmento.equipamento_nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gráfico de Linha - Segmento */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartDataSegmento} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="periodo"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="oee"
                          name="OEE"
                          stroke="#16a34a"
                          strokeWidth={3}
                          dot={{ fill: '#16a34a', r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="disponibilidade"
                          name="Disponibilidade"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#3b82f6', r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="performance"
                          name="Performance"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#f59e0b', r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="qualidade"
                          name="Qualidade"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#10b981', r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Estatísticas - Segmento */}
                  <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Média</p>
                      <p className={cn('text-2xl font-bold', getOEEColor(statsSegmento.media))}>
                        {statsSegmento.media.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Máximo</p>
                      <p className={cn('text-2xl font-bold', getOEEColor(statsSegmento.max))}>
                        {statsSegmento.max.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
                      <p className={cn('text-2xl font-bold', getOEEColor(statsSegmento.min))}>
                        {statsSegmento.min.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                      <Badge className={cn(
                        'w-full justify-center',
                        statsSegmento.tendencia === 'up' && 'bg-success',
                        statsSegmento.tendencia === 'down' && 'bg-destructive',
                        statsSegmento.tendencia === 'stable' && 'bg-warning',
                      )}>
                        {statsSegmento.tendencia === 'up' ? '↑ Subindo' : statsSegmento.tendencia === 'down' ? '↓ Caindo' : '→ Estável'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de Todos os Períodos */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Detalhe dos Períodos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold">Período</th>
                        <th className="text-center py-3 px-4 font-semibold">Disponibilidade</th>
                        <th className="text-center py-3 px-4 font-semibold">Performance</th>
                        <th className="text-center py-3 px-4 font-semibold">Qualidade</th>
                        <th className="text-center py-3 px-4 font-semibold">OEE</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(segmentoSelecionado === 'geral' ? chartData : chartDataSegmento).map((row, idx) => {
                        const level = getOEELevel(row.oee);
                        return (
                          <tr key={idx} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-4 font-medium">{row.periodo}</td>
                            <td className="text-center py-3 px-4">{row.disponibilidade.toFixed(1)}%</td>
                            <td className="text-center py-3 px-4">{row.performance.toFixed(1)}%</td>
                            <td className="text-center py-3 px-4">{row.qualidade.toFixed(1)}%</td>
                            <td className={cn('text-center py-3 px-4 font-bold', getOEEColor(row.oee))}>
                              {row.oee.toFixed(1)}%
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge className={cn(
                                'text-xs',
                                level === 'excellent' && 'bg-oee-excellent text-primary-foreground',
                                level === 'good' && 'bg-oee-good text-primary-foreground',
                                level === 'warning' && 'bg-oee-warning text-primary-foreground',
                                level === 'critical' && 'bg-oee-critical text-primary-foreground',
                              )}>
                                {level === 'excellent' && 'Excelente'}
                                {level === 'good' && 'Bom'}
                                {level === 'warning' && 'Atenção'}
                                {level === 'critical' && 'Crítico'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DashboardOEEPeriodos;
