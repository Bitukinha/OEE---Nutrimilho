import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOEEPorSegmento } from '@/hooks/useOEEPorSegmento';
import { cn } from '@/lib/utils';
import { getOEEColor, getOEELevel } from '@/types/oee';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Loader2 } from 'lucide-react';

interface OEESegmentoChartProps {
  dataInicio?: string;
  dataFim?: string;
}

const OEESegmentoChart = ({ dataInicio, dataFim }: OEESegmentoChartProps) => {
  const { data, isLoading } = useOEEPorSegmento(dataInicio, dataFim);

  if (isLoading) {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <CardHeader>
          <CardTitle>OEE por Segmento (Equipamento)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const segmentos = data?.segmentos || [];

  if (!segmentos.length) {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <CardHeader>
          <CardTitle>OEE por Segmento (Equipamento)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Dados para o gráfico de barras
  const chartData = segmentos.map(s => ({
    name: s.equipamento_nome.replace(' - ', '\n'),
    displayName: s.equipamento_nome,
    oee: s.oee,
    disponibilidade: s.disponibilidade,
    performance: s.performance,
    qualidade: s.qualidade,
  }));

  // Calcular média geral
  const mediaOEE = segmentos.length > 0
    ? (segmentos.reduce((acc, s) => acc + s.oee, 0) / segmentos.length).toFixed(1)
    : 0;

  // Cores baseadas no OEE
  const getBarColor = (oee: number) => {
    const level = getOEELevel(oee);
    const colors: Record<string, string> = {
      excellent: '#16a34a', // green
      good: '#ea580c', // orange
      warning: '#f59e0b', // amber
      critical: '#dc2626', // red
    };
    return colors[level] || '#6b7280';
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>OEE por Segmento (Equipamento)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Média Geral: {mediaOEE}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de Barras */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="displayName"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'OEE (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelFormatter={(label) => `Equipamento: ${label}`}
              />
              <Bar dataKey="oee" name="OEE" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.oee)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Detalhes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Detalhamento por Equipamento</h3>
          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
            {segmentos.map((segmento) => {
              const level = getOEELevel(segmento.oee);
              const levelLabels: Record<string, string> = {
                excellent: 'Excelente',
                good: 'Bom',
                warning: 'Atenção',
                critical: 'Crítico',
              };

              return (
                <div
                  key={segmento.equipamento_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {segmento.equipamento_nome}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Disp: {segmento.disponibilidade}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Perf: {segmento.performance}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qual: {segmento.qualidade}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Prod: {segmento.total_produzido} un
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className={cn('text-lg font-bold', getOEEColor(segmento.oee))}>
                        {segmento.oee}%
                      </p>
                      <Badge
                        className={cn(
                          'text-xs mt-1',
                          level === 'excellent' && 'bg-oee-excellent text-primary-foreground',
                          level === 'good' && 'bg-oee-good text-primary-foreground',
                          level === 'warning' && 'bg-oee-warning text-primary-foreground',
                          level === 'critical' && 'bg-oee-critical text-primary-foreground',
                        )}
                      >
                        {levelLabels[level]}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Melhor OEE</p>
            <p className={cn('text-lg font-bold', getOEEColor(Math.max(...segmentos.map(s => s.oee))))}>
              {Math.max(...segmentos.map(s => s.oee))}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pior OEE</p>
            <p className={cn('text-lg font-bold', getOEEColor(Math.min(...segmentos.map(s => s.oee))))}>
              {Math.min(...segmentos.map(s => s.oee))}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className={cn('text-lg font-bold', getOEEColor(Number(mediaOEE)))}>
              {mediaOEE}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Equipamentos</p>
            <p className="text-lg font-bold text-primary">
              {segmentos.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OEESegmentoChart;
