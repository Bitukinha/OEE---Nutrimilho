import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/oee/Header';
import MetricCard from '@/components/oee/MetricCard';
import OEEGauge from '@/components/oee/OEEGauge';
import OEEChart from '@/components/oee/OEEChart';
import OEESegmentoChart from '@/components/oee/OEESegmentoChart';
import ProductionTable from '@/components/oee/ProductionTable';
import OEETurnoCard from '@/components/oee/OEETurnoCard';
import ParetoParadas from '@/components/oee/ParetoParadas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOEEPorTurno } from '@/hooks/useOEEPorTurno';
import { useRegistrosProducao } from '@/hooks/useRegistrosProducao';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { useOEEHistorico } from '@/hooks/useOEEHistorico';
import { Clock, Gauge, Award, Activity, CheckCircle, AlertTriangle, Wrench, Loader2, CalendarIcon, History, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOEEColor } from '@/types/oee';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const statusConfig = {
  ativo: {
    label: 'Em Operação',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  inativo: {
    label: 'Parado',
    icon: AlertTriangle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  manutencao: {
    label: 'Manutenção',
    icon: Wrench,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const Index = () => {
  // OEE sempre é do dia anterior (dados preenchidos no fim do dia)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(yesterday);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '365'>('30');

  // Formatar data para query
  const dataFiltro = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
  const periodOptions = [
    { value: '7', label: 'Semanal' },
    { value: '30', label: 'Mensal' },
    { value: '365', label: 'Anual' },
  ];
  const diasPeriodo = Number(selectedPeriod);
  const { data: oeeData, isLoading: oeeLoading } = useOEEPorTurno(dataFiltro, dataFiltro);
  const { data: equipamentos, isLoading: equipamentosLoading } = useEquipamentos();
  const { data: registros, isLoading: registrosLoading } = useRegistrosProducao();
  const { data: historicoData, isLoading: historicoLoading } = useOEEHistorico(diasPeriodo);

  const isLoading = oeeLoading || equipamentosLoading || registrosLoading || historicoLoading;

  // Use real data or fallback to defaults
  const displayMetrics = oeeData?.geral || { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };
  const turnosOEE = oeeData?.porTurno || [];
  
  const turnosOrdenados = [...turnosOEE].sort((a, b) => {
    const ordem = ['Turno A', 'Turno B', 'Turno C'];
    return ordem.indexOf(a.turno_nome) - ordem.indexOf(b.turno_nome);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Title + Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dashboard OEE
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real da eficiência operacional
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const ontem = new Date();
                ontem.setDate(ontem.getDate() - 1);
                setSelectedDate(ontem);
              }}
            >
              Ontem
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Main OEE Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <Card variant="gradient" className="lg:col-span-1 animate-fade-in">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center">OEE Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <OEEGauge value={displayMetrics.oee} size="lg" />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {registros?.length ? `Média de ${registros.length} registros` : 'Sem registros ainda'}
                  </p>
                </CardContent>
              </Card>

              {/* Metric Cards */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Disponibilidade"
                  value={displayMetrics.disponibilidade}
                  icon={Clock}
                  description="Tempo produtivo / Tempo planejado"
                  borderColor="border-l-info"
                />
                <MetricCard
                  title="Performance"
                  value={displayMetrics.performance}
                  icon={Gauge}
                  description="Produção real / Produção ideal"
                  borderColor="border-l-warning"
                />
                <MetricCard
                  title="Qualidade"
                  value={displayMetrics.qualidade}
                  icon={Award}
                  description="Unidades boas / Total produzido"
                  borderColor="border-l-success"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Visão por período</h2>
                  <p className="text-muted-foreground mt-1">
                    Compare o OEE semanal, mensal e anual no mesmo painel.
                  </p>
                </div>
                <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as '7' | '30' | '365')} className="w-full max-w-lg">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="7">Semanal</TabsTrigger>
                    <TabsTrigger value="30">Mensal</TabsTrigger>
                    <TabsTrigger value="365">Anual</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {periodOptions.find((option) => option.value === selectedPeriod)?.label} OEE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historicoLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                          <h3 className="text-sm text-muted-foreground">OEE Médio</h3>
                          <p className="text-3xl font-bold text-foreground mt-3">
                            {historicoData?.geral.length
                              ? `${(historicoData.geral.reduce((sum, item) => sum + item.oee, 0) / historicoData.geral.length).toFixed(1)}%`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                          <h3 className="text-sm text-muted-foreground">Melhor Turno</h3>
                          <p className="text-3xl font-bold text-foreground mt-3">
                            {historicoData?.melhorTurno?.nome ?? '—'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {historicoData?.melhorTurno ? `${historicoData.melhorTurno.oee.toFixed(1)}%` : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                          <h3 className="text-sm text-muted-foreground">Pior Turno</h3>
                          <p className="text-3xl font-bold text-foreground mt-3">
                            {historicoData?.piorTurno?.nome ?? '—'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {historicoData?.piorTurno ? `${historicoData.piorTurno.oee.toFixed(1)}%` : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="h-[320px]">
                        {historicoData?.geral && historicoData.geral.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicoData.geral}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'OEE']} />
                              <ReferenceLine y={85} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                              <Line type="monotone" dataKey="oee" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            Sem dados para o período selecionado
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* OEE por Turno */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">
                A: 06:00–14:20 · B: 14:20–22:40 · C: 22:40–06:00
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {turnosOrdenados.map((turno, index) => (
                  <div key={turno.turno_id} style={{ animationDelay: `${0.1 * index}s` }}>
                    <OEETurnoCard turno={turno} />
                  </div>
                ))}
              </div>
              {turnosOrdenados.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum dado de turno disponível
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <OEEChart />
              </div>
              <div className="lg:col-span-1">
                <Card variant="elevated" className="h-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to="/historico" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico OEE
                      </Button>
                    </Link>
                    <Link to="/producao" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Registrar Produção
                      </Button>
                    </Link>
                    <Link to="/equipamentos" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Gerenciar Equipamentos
                      </Button>
                    </Link>
                    <Link to="/producao" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Exportar Relatório PDF
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pareto e Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ParetoParadas />
              <ProductionTable />
            </div>

            {/* OEE por Segmento */}
            <div className="mb-8">
              <OEESegmentoChart dataInicio={dataFiltro} dataFim={dataFiltro} />
            </div>

            {/* Equipment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Status dos Equipamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!equipamentos?.length ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum equipamento cadastrado
                    </p>
                  ) : (
                    equipamentos.slice(0, 4).map((equip) => {
                      const status = statusConfig[equip.status as keyof typeof statusConfig];
                      const StatusIcon = status?.icon || CheckCircle;

                      return (
                        <div
                          key={equip.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-medium text-foreground">{equip.nome}</h4>
                              <Badge variant="outline" className={cn("mt-1", status?.className)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status?.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Meta: {equip.capacidade_hora ? `${equip.capacidade_hora} kg` : '-'}
                          </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {equipamentos && equipamentos.length > 4 && (
                    <Link to="/equipamentos">
                      <Button variant="link" className="w-full">
                        Ver todos os equipamentos
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <ProductionTable />
            </div>

            {/* Footer */}
            <footer className="mt-12 py-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                © 2026 Nutrimilho - Sistema de Gestão OEE (Novaes Tech) | Todos os direitos reservados
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
