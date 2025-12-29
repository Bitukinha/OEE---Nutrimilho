import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOEEHistorico } from '@/hooks/useOEEHistorico';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';

const TURNO_COLORS: Record<string, string> = {
  'Turno A': 'hsl(142, 76%, 36%)',
  'Turno B': 'hsl(45, 93%, 47%)',
  'Turno C': 'hsl(200, 80%, 50%)',
  'Turno D': 'hsl(280, 60%, 50%)',
};

const getOEEColor = (oee: number) => {
  if (oee >= 85) return 'hsl(142, 76%, 36%)';
  if (oee >= 65) return 'hsl(45, 93%, 47%)';
  return 'hsl(0, 84%, 60%)';
};

const TendenciaIcon = ({ tendencia }: { tendencia: 'up' | 'down' | 'stable' }) => {
  if (tendencia === 'up') return <TrendingUp className="h-5 w-5 text-green-600" />;
  if (tendencia === 'down') return <TrendingDown className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
};

const Historico = () => {
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useOEEHistorico(dias);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Histórico OEE</h1>
            </div>
            <Select value={dias.toString()} onValueChange={(v) => setDias(Number(v))}>
              <SelectTrigger className="w-[180px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Cards de destaque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.melhorTurno && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Trophy className="h-5 w-5" />
                      Melhor Desempenho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                        {data.melhorTurno.nome}
                      </span>
                      <span className="text-xl text-green-600">
                        {data.melhorTurno.oee.toFixed(1)}% OEE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Média dos últimos {dias} dias
                    </p>
                  </CardContent>
                </Card>
              )}

              {data?.piorTurno && data.piorTurno.nome !== data?.melhorTurno?.nome && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                      Precisa Melhorar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                        {data.piorTurno.nome}
                      </span>
                      <span className="text-xl text-amber-600">
                        {data.piorTurno.oee.toFixed(1)}% OEE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Média dos últimos {dias} dias
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gráfico OEE Geral */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução OEE Geral</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.geral && data.geral.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.geral}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="data" 
                          tickFormatter={formatDate}
                          className="text-xs"
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          labelFormatter={(label) => format(new Date(label + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                          formatter={(value: number) => [`${value.toFixed(1)}%`]}
                        />
                        <Legend />
                        <ReferenceLine y={85} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" label="Meta" />
                        <Line type="monotone" dataKey="oee" name="OEE" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="disponibilidade" name="Disponibilidade" stroke="hsl(200, 80%, 50%)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="performance" name="Performance" stroke="hsl(280, 60%, 50%)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="qualidade" name="Qualidade" stroke="hsl(45, 93%, 47%)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparativo por Turno */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativo por Turno</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.porTurno && data.porTurno.some(t => t.dados.length > 0) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.porTurno.filter(t => t.dados.length > 0)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="turno_nome" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'OEE Médio']} />
                        <ReferenceLine y={85} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                        <Bar dataKey="media_oee" name="OEE Médio" radius={[4, 4, 0, 0]}>
                          {data.porTurno.filter(t => t.dados.length > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getOEEColor(entry.media_oee)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cards por Turno */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.porTurno.map((turno) => (
                <Card key={turno.turno_id} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: TURNO_COLORS[turno.turno_nome] || 'hsl(var(--primary))' }}
                  />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                      {turno.turno_nome}
                      <TendenciaIcon tendencia={turno.tendencia} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span 
                          className="text-3xl font-bold"
                          style={{ color: getOEEColor(turno.media_oee) }}
                        >
                          {turno.media_oee.toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">OEE médio</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {turno.dados.length} dia{turno.dados.length !== 1 ? 's' : ''} com registro
                      </p>
                      <p className="text-xs">
                        {turno.tendencia === 'up' && (
                          <span className="text-green-600">Tendência de melhora ↑</span>
                        )}
                        {turno.tendencia === 'down' && (
                          <span className="text-red-500">Tendência de queda ↓</span>
                        )}
                        {turno.tendencia === 'stable' && (
                          <span className="text-muted-foreground">Tendência estável</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Evolução por Turno */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução OEE por Turno</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.porTurno && data.porTurno.some(t => t.dados.length > 0) ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="data" 
                          tickFormatter={formatDate}
                          allowDuplicatedCategory={false}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          labelFormatter={(label) => format(new Date(label + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                        />
                        <Legend />
                        <ReferenceLine y={85} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                        {data.porTurno.filter(t => t.dados.length > 0).map((turno) => (
                          <Line 
                            key={turno.turno_id}
                            data={turno.dados}
                            type="monotone" 
                            dataKey="oee" 
                            name={turno.turno_nome}
                            stroke={TURNO_COLORS[turno.turno_nome] || 'hsl(var(--primary))'}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Historico;
