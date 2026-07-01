import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParadas } from '@/hooks/useParadas';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

interface TendenciaParadasProps {
  dataInicio?: string;
  dataFim?: string;
  turnoId?: string;
}

const TendenciaParadas = ({ dataInicio, dataFim, turnoId }: TendenciaParadasProps) => {
  const { data: paradas, isLoading } = useParadas({
    dataInicio,
    dataFim,
    turnoId,
  });

  const chartData = useMemo(() => {
    if (!paradas?.length) return [];

    // Agrupar por data
    const porData = new Map<string, {
      duracao: number;
      quantidade: number;
    }>();

    paradas.forEach((parada) => {
      const data = parada.data;
      const existing = porData.get(data) || { duracao: 0, quantidade: 0 };
      porData.set(data, {
        duracao: existing.duracao + parada.duracao,
        quantidade: existing.quantidade + 1,
      });
    });

    // Converter para array ordenado
    return Array.from(porData.entries())
      .map(([data, valores]) => ({
        data,
        dataFormatada: format(new Date(data + 'T00:00:00'), 'dd/MM', { locale: ptBR }),
        duracao: valores.duracao,
        quantidade: valores.quantidade,
        mediaHoras: Number((valores.duracao / 60).toFixed(2)),
      }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [paradas]);

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência de Paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Sem dados de paradas para exibir tendência
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendência de Paradas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Duração total e quantidade de paradas por dia
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="dataFormatada" 
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              label={{ value: 'Quantidade', angle: 90, position: 'insideRight', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                if (name === 'duracao') return `${value} min`;
                if (name === 'quantidade') return `${value} paradas`;
                return value;
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="duracao"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))' }}
              name="Duração (min)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="quantidade"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))' }}
              name="Quantidade"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TendenciaParadas;
