import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/oee/Header';
import ProdutoBloqueadoForm from '@/components/oee/ProdutoBloqueadoForm';
import ParetoBloqueios from '@/components/oee/ParetoBloqueios';
import TendenciaQualidade from '@/components/oee/TendenciaQualidade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useProdutosBloqueados, useDeleteProdutoBloqueado, useQualidadeMetrics } from '@/hooks/useProdutosBloqueados';
import { useOEEPorTurno } from '@/hooks/useOEEPorTurno';
import { useTurnos } from '@/hooks/useTurnos';
import { exportQualidadeReport } from '@/lib/pdfExport';
import { ShieldAlert, Trash2, Filter, X, Loader2, Package, AlertTriangle, RefreshCw, TrendingDown, Gauge, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const Qualidade = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [turnoId, setTurnoId] = useState('');
  
  const { data: produtos, isLoading } = useProdutosBloqueados({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    turnoId: turnoId || undefined,
  });
  const { data: metrics } = useQualidadeMetrics();
  const { data: oeeData } = useOEEPorTurno(dataInicio || undefined, dataFim || undefined);
  const { data: turnos } = useTurnos();
  const deleteMutation = useDeleteProdutoBloqueado();

  // Calcular impacto estimado no OEE
  const qualidadeAtual = oeeData?.geral?.qualidade || 0;
  const oeeAtual = oeeData?.geral?.oee || 0;

  // Calcular métricas por motivo para o PDF
  const porMotivo = useMemo(() => {
    if (!produtos?.length) return {};
    return produtos.reduce((acc, p) => {
      acc[p.motivo_bloqueio] = (acc[p.motivo_bloqueio] || 0) + p.quantidade;
      return acc;
    }, {} as Record<string, number>);
  }, [produtos]);

  const clearFilters = () => {
    setDataInicio('');
    setDataFim('');
    setTurnoId('');
  };

  const handleExportPDF = async () => {
    if (!produtos) return;
    
    await exportQualidadeReport(
      produtos,
      {
        totalBloqueado: metrics?.totalBloqueado || 0,
        qualidadeOEE: qualidadeAtual,
        oeeGeral: oeeAtual,
        porDestino: metrics?.porDestino || {},
        porMotivo,
      },
      { dataInicio: dataInicio || undefined, dataFim: dataFim || undefined }
    );
  };

  const getDestinoBadgeColor = (destino: string) => {
    switch (destino) {
      case 'Descarte':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Reprocesso':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Quarentena':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Qualidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão de produtos bloqueados e não conformidades
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!produtos?.length}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <ProdutoBloqueadoForm />
          </div>
        </div>

        {/* Indicador de Impacto no OEE */}
        <Card variant="elevated" className="mb-8 border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Gauge className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Qualidade OEE (com bloqueios)</p>
                  <p className={cn(
                    "text-4xl font-bold",
                    qualidadeAtual >= 95 ? "text-success" :
                    qualidadeAtual >= 85 ? "text-warning" : "text-destructive"
                  )}>
                    {qualidadeAtual.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-destructive/10">
                  <TrendingDown className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Impacto dos Bloqueios</p>
                  <p className="text-4xl font-bold text-destructive">
                    -{metrics?.totalBloqueado || 0} kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-muted">
                  <Gauge className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">OEE Geral</p>
                  <p className={cn(
                    "text-4xl font-bold",
                    oeeAtual >= 85 ? "text-success" :
                    oeeAtual >= 65 ? "text-warning" : "text-destructive"
                  )}>
                    {oeeAtual.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <Package className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bloqueado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.totalBloqueado || 0} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <RefreshCw className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Para Reprocesso</p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.porDestino?.['Reprocesso'] || 0} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descarte</p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.porDestino?.['Descarte'] || 0} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ParetoBloqueios dataInicio={dataInicio || undefined} dataFim={dataFim || undefined} />
          <TendenciaQualidade dataInicio={dataInicio || undefined} dataFim={dataFim || undefined} turnoId={turnoId || undefined} />
        </div>

        {/* Filtros */}
        <Card variant="elevated" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select
                  value={turnoId || 'all'}
                  onValueChange={(value) => setTurnoId(value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {turnos?.map((turno) => (
                      <SelectItem key={turno.id} value={turno.id}>
                        {turno.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(dataInicio || dataFim || turnoId) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Produtos Bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !produtos?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum produto bloqueado registrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Lacre</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">
                          {produto.data ? format(parseISO(produto.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>{produto.turnos?.nome || '-'}</TableCell>
                        <TableCell>{produto.equipamentos?.nome || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {produto.motivo_bloqueio}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {produto.quantidade}
                        </TableCell>
                        <TableCell>{produto.numero_lacre || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(getDestinoBadgeColor(produto.destino))}
                          >
                            {produto.destino}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(produto.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Qualidade;
