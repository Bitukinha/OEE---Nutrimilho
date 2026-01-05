import { useState } from 'react';
import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useParadas, useDeleteParada } from '@/hooks/useParadas';
import ParadaForm from '@/components/oee/ParadaForm';
import ParetoParadas from '@/components/oee/ParetoParadas';
import TendenciaParadas from '@/components/oee/TendenciaParadas';
import { exportParadasReport } from '@/lib/pdfExport';
import { Trash2, Clock, Loader2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTurnos } from '@/hooks/useTurnos';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoriaConfig: Record<string, { label: string; className: string }> = {
  nao_planejada: { label: 'Não Planejada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  planejada: { label: 'Planejada', className: 'bg-primary/10 text-primary border-primary/20' },
  manutencao: { label: 'Manutenção', className: 'bg-warning/10 text-warning border-warning/20' },
  setup: { label: 'Setup', className: 'bg-muted text-muted-foreground border-muted' },
};

const Paradas = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [turnoId, setTurnoId] = useState('');

  const { data: paradas, isLoading } = useParadas({ dataInicio, dataFim, turnoId });
  const deleteMutation = useDeleteParada();
  const { data: turnos } = useTurnos();

  const totalMinutos = paradas?.reduce((acc, p) => acc + p.duracao, 0) || 0;
  const totalParadas = paradas?.length || 0;
  const mediaMinutos = totalParadas > 0 ? totalMinutos / totalParadas : 0;

  const porCategoria: Record<string, number> = {};
  paradas?.forEach(p => {
    porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + p.duracao;
  });

  const handleExportPDF = () => {
    if (!paradas) return;
    exportParadasReport(paradas, {
      totalMinutos,
      totalParadas,
      mediaMinutos,
      porCategoria,
    }, {
      dataInicio,
      dataFim,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Paradas de Máquina
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre e gerencie as paradas por turno e segmento
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <ParadaForm />
          </div>
        </div>

        {/* Summary Card */}
        <Card variant="elevated" className="mb-6 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Clock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Paradas Registradas</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalMinutos} minutos
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({(totalMinutos / 60).toFixed(1)} horas)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card variant="elevated" className="mb-6 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="turno">Turno</Label>
                <Select
                  value={turnoId || 'all'}
                  onValueChange={(value) => setTurnoId(value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-full">
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
              <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                    setTurnoId('');
                    setDataFim('');
                    setTurnoId('');
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <ParetoParadas />
          <TendenciaParadas dataInicio={dataInicio} dataFim={dataFim} turnoId={turnoId} />
        </div>

        {/* Table */}
        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Histórico de Paradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !paradas?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma parada registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Turno</TableHead>
                      <TableHead className="font-semibold">Segmento</TableHead>
                      <TableHead className="font-semibold text-center">Duração</TableHead>
                      <TableHead className="font-semibold">Categoria</TableHead>
                      <TableHead className="font-semibold">Motivo</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paradas.map((parada) => {
                      const categoria = categoriaConfig[parada.categoria] || categoriaConfig.nao_planejada;
                      return (
                        <TableRow key={parada.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {parada.data ? format(parseISO(parada.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>{parada.turnos?.nome || '-'}</TableCell>
                          <TableCell>{parada.equipamentos?.nome || '-'}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {parada.duracao} min
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(categoria.className)}>
                              {categoria.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={parada.motivo}>
                            {parada.motivo}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Parada</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este registro de parada? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(parada.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default Paradas;
