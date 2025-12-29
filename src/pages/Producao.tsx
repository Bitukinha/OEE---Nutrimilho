import { useState } from 'react';
import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useRegistrosProducao, useDeleteRegistroProducao, useOEEMetrics } from '@/hooks/useRegistrosProducao';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import RegistroProducaoForm from '@/components/oee/RegistroProducaoForm';
import { exportOEEReport } from '@/lib/pdfExport';
import { FileSpreadsheet, Trash2, FileDown, Loader2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOEEColor, getOEELevel } from '@/types/oee';
import { useTurnos } from '@/hooks/useTurnos';

const Producao = () => {
  const [filters, setFilters] = useState<{
    dataInicio?: string;
    dataFim?: string;
    equipamentoId?: string;
    turnoId?: string;
  }>({});
  
  const { data: registros, isLoading } = useRegistrosProducao(filters);
  const { data: metrics } = useOEEMetrics();
  const { data: equipamentos } = useEquipamentos();
  const { data: turnos } = useTurnos();
  const deleteMutation = useDeleteRegistroProducao();

  const levelLabels = {
    excellent: 'Excelente',
    good: 'Bom',
    warning: 'Atenção',
    critical: 'Crítico',
  };

  const handleExportPDF = () => {
    if (!registros || !metrics) return;
    const equipamento = equipamentos?.find(e => e.id === filters.equipamentoId);
    exportOEEReport(registros, metrics, {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      equipamento: equipamento?.nome,
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Produção
            </h1>
            <p className="text-muted-foreground mt-1">
              Registros de produção e cálculo de OEE
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!registros?.length}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <RegistroProducaoForm />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio || ''}
                  onChange={(e) => setFilters(f => ({ ...f, dataInicio: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filters.dataFim || ''}
                  onChange={(e) => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipamento">Equipamento</Label>
                <Select
                  value={filters.equipamentoId || 'all'}
                  onValueChange={(value) => setFilters(f => ({
                    ...f,
                    equipamentoId: value === 'all' ? undefined : value
                  }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {equipamentos?.map((equip) => (
                      <SelectItem key={equip.id} value={equip.id}>
                        {equip.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <Select
                  value={filters.turnoId || 'all'}
                  onValueChange={(value) => setFilters(f => ({
                    ...f,
                    turnoId: value === 'all' ? undefined : value
                  }))}
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
              <Button variant="ghost" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Registros de Produção
              {registros && (
                <Badge variant="outline" className="ml-2">
                  {registros.length} registros
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !registros?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum registro encontrado. Crie um novo registro de produção.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Turno</TableHead>
                      <TableHead className="font-semibold">Equipamento</TableHead>
                      <TableHead className="font-semibold text-center">Disp.</TableHead>
                      <TableHead className="font-semibold text-center">Perf.</TableHead>
                      <TableHead className="font-semibold text-center">Qual.</TableHead>
                      <TableHead className="font-semibold text-center">OEE</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((registro) => {
                      const oeeValue = Number(registro.oee);
                      const level = getOEELevel(oeeValue);
                      return (
                        <TableRow key={registro.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {new Date(registro.data).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {registro.turnos?.nome || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {registro.equipamentos?.nome || '-'}
                          </TableCell>
                          <TableCell className={cn("text-center font-medium", getOEEColor(Number(registro.disponibilidade)))}>
                            {Number(registro.disponibilidade).toFixed(1)}%
                          </TableCell>
                          <TableCell className={cn("text-center font-medium", getOEEColor(Number(registro.performance)))}>
                            {Number(registro.performance).toFixed(1)}%
                          </TableCell>
                          <TableCell className={cn("text-center font-medium", getOEEColor(Number(registro.qualidade)))}>
                            {Number(registro.qualidade).toFixed(1)}%
                          </TableCell>
                          <TableCell className={cn("text-center font-bold text-lg", getOEEColor(oeeValue))}>
                            {oeeValue.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-xs",
                                level === 'excellent' && "bg-oee-excellent text-primary-foreground",
                                level === 'good' && "bg-oee-good text-primary-foreground",
                                level === 'warning' && "bg-oee-warning text-secondary-foreground",
                                level === 'critical' && "bg-oee-critical text-primary-foreground"
                              )}
                            >
                              {levelLabels[level]}
                            </Badge>
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
                                  <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(registro.id)}
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

export default Producao;
