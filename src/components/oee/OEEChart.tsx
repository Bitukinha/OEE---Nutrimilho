import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useRegistrosProducao } from '@/hooks/useRegistrosProducao';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

const OEEChart = () => {
  const { data: registros, isLoading } = useRegistrosProducao();

  const chartData = useMemo(() => {
    if (!registros?.length) return [];

    // Group by date and calculate averages
    const groupedByDate = registros.reduce((acc, registro) => {
      const date = registro.data;
      if (!acc[date]) {
        acc[date] = { oee: [], disponibilidade: [], performance: [], qualidade: [] };
      }
      acc[date].oee.push(Number(registro.oee));
      acc[date].disponibilidade.push(Number(registro.disponibilidade));
      acc[date].performance.push(Number(registro.performance));
      acc[date].qualidade.push(Number(registro.qualidade));
      return acc;
    }, {} as Record<string, { oee: number[]; disponibilidade: number[]; performance: number[]; qualidade: number[] }>);

    const avgData = Object.entries(groupedByDate)
      .map(([date, values]) => ({
        day: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        oee: values.oee.reduce((a, b) => a + b, 0) / values.oee.length,
        disponibilidade: values.disponibilidade.reduce((a, b) => a + b, 0) / values.disponibilidade.length,
        performance: values.performance.reduce((a, b) => a + b, 0) / values.performance.length,
        qualidade: values.qualidade.reduce((a, b) => a + b, 0) / values.qualidade.length,
        date,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    return avgData;
  }, [registros]);

  return (
    <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle>Tendência OEE - Últimos Registros</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !chartData.length ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Sem dados suficientes para exibir o gráfico
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="oee"
                  name="OEE"
                  stroke="#2E7D32"
                  strokeWidth={3}
                  dot={{ fill: '#2E7D32', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#2E7D32' }}
                />
                <Line
                  type="monotone"
                  dataKey="disponibilidade"
                  name="Disponibilidade"
                  stroke="#1976D2"
                  strokeWidth={2}
                  dot={{ fill: '#1976D2', r: 3 }}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  name="Performance"
                  stroke="#F9A825"
                  strokeWidth={2}
                  dot={{ fill: '#F9A825', r: 3 }}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="qualidade"
                  name="Qualidade"
                  stroke="#7B1FA2"
                  strokeWidth={2}
                  dot={{ fill: '#7B1FA2', r: 3 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OEEChart;
