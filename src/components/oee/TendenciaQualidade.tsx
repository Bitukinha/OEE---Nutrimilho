import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegistrosProducao } from '@/hooks/useRegistrosProducao';
import { useProdutosBloqueados } from '@/hooks/useProdutosBloqueados';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

interface TendenciaQualidadeProps {
  dataInicio?: string;
  dataFim?: string;
}

const TendenciaQualidade = ({ dataInicio, dataFim }: TendenciaQualidadeProps) => {
  const { data: registros, isLoading: loadingRegistros } = useRegistrosProducao({
    dataInicio,
    dataFim,
  });
  const { data: bloqueados, isLoading: loadingBloqueados } = useProdutosBloqueados({
    dataInicio,
    dataFim,
  });

  const chartData = useMemo(() => {
    if (!registros?.length) return [];

    // Agrupar por data
    const porData = new Map<string, {
      totalProduzido: number;
      unidadesBoas: number;
      bloqueados: number;
    }>();

    // Agregar registros de produção
    registros.forEach((registro) => {
      const data = registro.data;
      const existing = porData.get(data) || { totalProduzido: 0, unidadesBoas: 0, bloqueados: 0 };
      porData.set(data, {
        ...existing,
        totalProduzido: existing.totalProduzido + registro.total_produzido,
        unidadesBoas: existing.unidadesBoas + registro.unidades_boas,
      });
    });

    // Agregar produtos bloqueados
    bloqueados?.forEach((bloqueado) => {
      const data = bloqueado.data;
      const existing = porData.get(data);
      if (existing) {
        porData.set(data, {
          ...existing,
          bloqueados: existing.bloqueados + bloqueado.quantidade,
        });
      }
    });

    // Converter para array e calcular qualidade
    return Array.from(porData.entries())
      .map(([data, valores]) => {
        const unidadesBonsFinal = Math.max(0, valores.unidadesBoas - valores.bloqueados);
        const qualidade = valores.totalProduzido > 0 
          ? (unidadesBonsFinal / valores.totalProduzido) * 100 
          : 100;
        
        return {
          data,
          dataFormatada: format(new Date(data + 'T00:00:00'), 'dd/MM', { locale: ptBR }),
          qualidade: Number(qualidade.toFixed(1)),
          bloqueados: valores.bloqueados,
          totalProduzido: valores.totalProduzido,
        };
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [registros, bloqueados]);

  const isLoading = loadingRegistros || loadingBloqueados;

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
            Tendência de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Sem dados de produção para exibir tendência
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendência de Qualidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="dataFormatada" 
                className="text-xs fill-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs fill-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'qualidade') return [`${value}%`, 'Qualidade'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend 
                formatter={(value) => value === 'qualidade' ? 'Qualidade (%)' : value}
              />
              <ReferenceLine 
                y={95} 
                stroke="hsl(var(--success))" 
                strokeDasharray="5 5" 
                label={{ 
                  value: 'Meta 95%', 
                  fill: 'hsl(var(--success))',
                  fontSize: 12,
                  position: 'right'
                }} 
              />
              <ReferenceLine 
                y={85} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="qualidade"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TendenciaQualidade;
