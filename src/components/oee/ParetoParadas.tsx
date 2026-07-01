import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParadas } from '@/hooks/useParadas';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';

interface ParetoData {
  motivo: string;
  duracao: number;
  percentual: number;
  acumulado: number;
}

const ParetoParadas = () => {
  const { data: paradas, isLoading } = useParadas();

  const paretoData = useMemo(() => {
    if (!paradas || paradas.length === 0) return [];

    // Agrupar paradas por motivo
    const agrupado: Record<string, number> = {};
    paradas.forEach(p => {
      const motivo = p.motivo || 'Não especificado';
      agrupado[motivo] = (agrupado[motivo] || 0) + p.duracao;
    });

    // Ordenar por duração decrescente
    const ordenado = Object.entries(agrupado)
      .map(([motivo, duracao]) => ({ motivo, duracao }))
      .sort((a, b) => b.duracao - a.duracao);

    // Calcular total e percentuais
    const total = ordenado.reduce((acc, item) => acc + item.duracao, 0);
    
    let acumulado = 0;
    const resultado: ParetoData[] = ordenado.slice(0, 8).map(item => {
      const percentual = (item.duracao / total) * 100;
      acumulado += percentual;
      return {
        motivo: item.motivo.length > 15 ? item.motivo.substring(0, 15) + '...' : item.motivo,
        duracao: item.duracao,
        percentual: Number(percentual.toFixed(1)),
        acumulado: Number(acumulado.toFixed(1)),
      };
    });

    return resultado;
  }, [paradas]);

  const totalMinutos = paretoData.reduce((acc, item) => acc + item.duracao, 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Pareto de Paradas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalMinutos} min ({totalHoras}h)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paretoData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma parada registrada
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="motivo" 
                tick={{ fontSize: 11 }}
                angle={-20}
                textAnchor="end"
                height={60}
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
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'duracao') return [`${value} min`, 'Duração'];
                  if (name === 'acumulado') return [`${value}%`, 'Acumulado'];
                  return [value, name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'duracao') return 'Duração (min)';
                  if (value === 'acumulado') return '% Acumulado';
                  return value;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="duracao" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="duracao"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="acumulado" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }}
                name="acumulado"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ParetoParadas;
