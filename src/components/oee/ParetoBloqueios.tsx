import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart, ResponsiveContainer, Cell } from 'recharts';
import { useProdutosBloqueados } from '@/hooks/useProdutosBloqueados';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ParetoBloqueiosProps {
  dataInicio?: string;
  dataFim?: string;
}

const ParetoBloqueios = ({ dataInicio, dataFim }: ParetoBloqueiosProps) => {
  const { data: bloqueados, isLoading } = useProdutosBloqueados({
    dataInicio,
    dataFim,
  });

  const paretoData = useMemo(() => {
    if (!bloqueados?.length) return [];

    // Agrupar por motivo
    const motivosMap: Record<string, number> = {};
    bloqueados.forEach(b => {
      const motivo = b.motivo_bloqueio || 'Não especificado';
      motivosMap[motivo] = (motivosMap[motivo] || 0) + b.quantidade;
    });

    // Converter para array e ordenar por quantidade
    const sortedMotivos = Object.entries(motivosMap)
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Calcular total e percentuais acumulados
    const total = sortedMotivos.reduce((acc, item) => acc + item.quantidade, 0);
    let acumulado = 0;

    return sortedMotivos.map(item => {
      acumulado += item.quantidade;
      return {
        motivo: item.motivo.length > 20 ? item.motivo.substring(0, 20) + '...' : item.motivo,
        motivoCompleto: item.motivo,
        quantidade: item.quantidade,
        percentual: Number(((item.quantidade / total) * 100).toFixed(1)),
        acumulado: Number(((acumulado / total) * 100).toFixed(1)),
      };
    });
  }, [bloqueados]);

  const getBarColor = (index: number) => {
    const colors = [
      'hsl(var(--destructive))',
      'hsl(var(--warning))',
      'hsl(var(--primary))',
      'hsl(var(--info))',
      'hsl(var(--muted-foreground))',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!paretoData.length) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Pareto de Bloqueios
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          Nenhum bloqueio registrado no período
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Pareto de Bloqueios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="motivo" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: '% Acumulado', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                if (name === 'quantidade') return [`${value} un`, 'Quantidade'];
                if (name === 'acumulado') return [`${value}%`, 'Acumulado'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item?.motivoCompleto || label;
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="quantidade" 
              radius={[4, 4, 0, 0]}
            >
              {paretoData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="acumulado" 
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          {paretoData.slice(0, 5).map((item, index) => (
            <div key={item.motivo} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: getBarColor(index) }}
              />
              <span className="text-muted-foreground">
                {item.motivo}: {item.percentual}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParetoBloqueios;